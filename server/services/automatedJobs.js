// CODEMAP: BACKEND_SERVICE_AUTOMATEDJOBS
// PURPOSE: Contains business logic and interacts with databases or external APIs.
// SEARCH_HINT: Look here for core business logic and data access patterns.
const cron = require('node-cron');
const { ComboPack, DailyStock, MenuItem, Order, Delivery, TokenBlacklist, sequelize } = require('../models');
const { Op } = require('sequelize');
const stockService = require('../services/stockService');
const systemSettingsService = require('../services/systemSettingsService');
const orderService = require('../services/orderService');

/**
 * Automated Jobs Service
 * Implements FR19, FR25, and system maintenance tasks
 */
class AutomatedJobsService {
    constructor() {
        this.jobs = [];
    }

    /**
     * Start all automated jobs
     * 
     * PART 1: Daily stock record generation
     * - Runs at 12:00 AM (midnight) every day
     * - Creates daily_stock records for all active menu items
     * - Sets opening quantity = previous day's closing quantity
     * - Uses SERIALIZABLE transactions to prevent race conditions
     */
    async start() {
        console.log('🤖 Starting automated jobs...');
        const runtimeSettings = await systemSettingsService.getRuntimeSettings();
        const configuredTimezone = runtimeSettings.timezone || process.env.TZ || 'Asia/Colombo';

        // Job 1: Daily stock creation at 12:00 AM (PART 1)
        // Runs at the start of each day to prepare stock records
        this.jobs.push(
            cron.schedule('0 0 * * *', async () => {
                await this.createDailyStockRecords();
            }, {
                name: 'Daily Stock Creation',
                timezone: configuredTimezone
            })
        );

        // Job 2: Activate/deactivate combo packs based on schedule (FR19)
        this.jobs.push(
            cron.schedule('0 0 * * *', async () => {
                await this.updateComboPackSchedules();
            })
        );

        // Job 3: Auto-disable out-of-stock menu items (FR25)
        this.jobs.push(
            cron.schedule('*/15 * * * *', async () => {
                await this.autoDisableOutOfStockItems();
            })
        );

        // Job 4: Repair legacy pending orders
        this.jobs.push(
            cron.schedule('*/10 * * * *', async () => {
                await this.autoConfirmPendingOrders();
            })
        );

        // Job 5: Clean expired blacklisted tokens
        this.jobs.push(
            cron.schedule('0 */6 * * *', async () => {
                await this.cleanExpiredTokens();
            })
        );

        // Job 6: Retry delivery auto-assignment for READY orders
        this.jobs.push(
            cron.schedule('*/2 * * * *', async () => {
                await this.retryPendingDeliveryAssignments();
            })
        );

        console.log('✅ Automated jobs started');
        console.log(`   - Daily stock creation: 12:00 AM (${configuredTimezone})`);
        console.log('   - Combo pack schedules: 12:00 AM');
        console.log('   - Out-of-stock check: Every 15 minutes');
        console.log('   - Pending order repair: Every 10 minutes');
        console.log('   - Token cleanup: Every 6 hours');
        console.log('   - Delivery assignment retry: Every 2 minutes');
    }

    /**
     * Stop all automated jobs
     */
    stop() {
        this.jobs.forEach(job => job.stop());
        console.log('⏹️  Automated jobs stopped');
    }

    /**
     * Update combo pack schedules (FR19)
     * Activate/deactivate combo packs based on schedule dates
     */
    async updateComboPackSchedules() {
        try {
            console.log('🔄 Updating combo pack schedules...');

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Activate combo packs that should start today
            const toActivate = await ComboPack.update(
                { is_active: true },
                {
                    where: {
                        is_active: false,
                        schedule_start_date: {
                            [Op.lte]: today
                        },
                        [Op.or]: [
                            { schedule_end_date: null },
                            { schedule_end_date: { [Op.gte]: today } }
                        ]
                    }
                }
            );

            // Deactivate combo packs that have ended
            const toDeactivate = await ComboPack.update(
                { is_active: false },
                {
                    where: {
                        is_active: true,
                        schedule_end_date: {
                            [Op.lt]: today
                        }
                    }
                }
            );

            console.log(`✅ Combo packs updated: ${toActivate[0]} activated, ${toDeactivate[0]} deactivated`);
        } catch (error) {
            console.error('❌ Error updating combo pack schedules:', error);
        }
    }

    /**
     * Auto-disable out-of-stock menu items (FR25)
     */
    async autoDisableOutOfStockItems() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const disabledItems = await stockService.autoDisableOutOfStockItems(today);

            if (disabledItems.length > 0) {
                console.log(`✅ Auto-disabled ${disabledItems.length} out-of-stock items`);
            }
        } catch (error) {
            console.error('❌ Error auto-disabling out-of-stock items:', error);
        }
    }

    /**
     * Auto-confirm any legacy pending orders.
     */
    async autoConfirmPendingOrders() {
        try {
            const pendingOrders = await Order.findAll({
                where: {
                    Status: 'PENDING'
                }
            });

            let confirmedCount = 0;

            for (const order of pendingOrders) {
                try {
                    await orderService.confirmOrder(order.OrderID, null);
                    confirmedCount += 1;
                } catch (confirmError) {
                    console.error(`❌ Error auto-confirming pending order ${order.OrderID}:`, confirmError.message);
                }
            }

            if (confirmedCount > 0) {
                console.log(`✅ Auto-confirmed ${confirmedCount} legacy pending orders`);
            }
        } catch (error) {
            console.error('❌ Error repairing pending orders:', error);
        }
    }

    /**
     * Retry auto-assignment for delivery orders that are READY but still unassigned.
     * This protects the flow when no delivery staff was available at the exact
     * moment kitchen moved an order to READY.
     */
    async retryPendingDeliveryAssignments() {
        try {
            const pendingDeliveries = await Delivery.findAll({
                where: {
                    Status: 'PENDING',
                    DeliveryStaffID: null
                },
                include: [{
                    model: Order,
                    as: 'order',
                    attributes: ['OrderID', 'OrderNumber', 'OrderType', 'Status']
                }],
                order: [['updated_at', 'ASC']],
                limit: 50
            });

            let attempted = 0;
            let assigned = 0;

            for (const delivery of pendingDeliveries) {
                const order = delivery.order;

                if (!order || order.OrderType !== 'DELIVERY' || order.Status !== 'READY') {
                    continue;
                }

                attempted += 1;

                try {
                    const staffId = await orderService.autoAssignDeliveryStaff(order.OrderID);
                    if (staffId) {
                        assigned += 1;
                    }
                } catch (assignmentError) {
                    console.error(
                        `❌ Retry assignment failed for order ${order.OrderID} (${order.OrderNumber || 'N/A'}):`,
                        assignmentError.message
                    );
                }
            }

            if (attempted > 0) {
                console.log(`✅ Delivery assignment retry: attempted ${attempted}, assigned ${assigned}`);
            }
        } catch (error) {
            console.error('❌ Error retrying pending delivery assignments:', error.message);
        }
    }

    /**
     * Clean expired blacklisted tokens
     */
    async cleanExpiredTokens() {
        try {
            const deleted = await TokenBlacklist.destroy({
                where: {
                    expires_at: {
                        [Op.lt]: new Date()
                    }
                }
            });

            if (deleted > 0) {
                console.log(`✅ Cleaned ${deleted} expired tokens from blacklist`);
            }

            const cleanupResult = await sequelize.query(
                `DELETE FROM email_verification_token
                 WHERE expires_at < NOW()
                    OR (used_at IS NOT NULL AND used_at < DATE_SUB(NOW(), INTERVAL 7 DAY))`,
                {
                    type: sequelize.QueryTypes.DELETE
                }
            );

            const deletedVerificationTokens = typeof cleanupResult === 'number'
                ? cleanupResult
                : Number(cleanupResult?.affectedRows || 0);

            if (deletedVerificationTokens > 0) {
                console.log(`✅ Cleaned ${deletedVerificationTokens} stale email verification tokens`);
            }
        } catch (error) {
            console.error('❌ Error cleaning expired tokens:', error);
        }
    }

    /**
     * PART 1: Create daily stock records for all active menu items
     * Runs at 12:00 AM each day using node-cron
     * 
     * CRITICAL: Includes retry logic with exponential backoff
     * If job fails 3 times, admin is notified via email and system logs error
     * This prevents order confirmation failures due to missing stock records
     * 
     * Process:
     * 1. Query all active menu items
     * 2. For each item, check if stock record exists for today
     * 3. If not, get yesterday's closing quantity as opening quantity
     * 4. Create new stock record with opening qty, sold=0, adjusted=0
     * 5. Uses SERIALIZABLE transactions and SELECT FOR UPDATE
     * 6. Unique constraint prevents duplicate (MenuItemID, StockDate)
     * 7. Implements 3 retries with exponential backoff (1s, 2s, 4s)
     * 8. Notifies admin via email on persistent failure
     */
    async createDailyStockRecords() {
        const maxRetries = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Creating daily stock records... (Attempt ${attempt}/${maxRetries})`);
                const result = await stockService.createDailyStockRecords();
                console.log(`✅ Daily stock creation completed: Created=${result.created}, Skipped=${result.skipped}, Failed=${result.failed}`);
                return; // Success - exit retry loop
            } catch (error) {
                lastError = error;
                console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, error.message);

                if (attempt < maxRetries) {
                    // Exponential backoff: 1s, 2s, 4s
                    const backoffMs = Math.pow(2, attempt - 1) * 1000;
                    console.log(`⏳ Retrying in ${backoffMs}ms...`);
                    await new Promise(resolve => setTimeout(resolve, backoffMs));
                }
            }
        }

        // ===== ALL RETRIES EXHAUSTED =====
        console.error('🚨 CRITICAL: Daily stock creation failed after 3 retries. System is at risk!');
        console.error('Error details:', lastError.message);
        console.error('Stack trace:', lastError.stack);

        // Log to activity log for admin review
        const { ActivityLog } = require('../models');
        try {
            await ActivityLog.create({
                UserType: 'SYSTEM',
                UserID: null,
                Action: 'DAILY_STOCK_JOB_FAILED',
                EntityType: 'DailyStock',
                EntityID: null,
                Details: {
                    message: `Daily stock creation failed after ${maxRetries} retries: ${lastError.message}`,
                    severity: 'CRITICAL'
                }
            }).catch(err => console.error('Failed to log activity:', err));
        } catch (logError) {
            console.error('Failed to create activity log:', logError.message);
        }

        // Send critical alert email to admin
        const { sendAdminCriticalAlert } = require('./emailService');
        try {
            const alertDetails = `
Daily Stock Automation Job Failed
=====================================
Job: Daily Stock Record Creation
Scheduled Time: 12:00 AM (Asia/Colombo)
Retries Attempted: ${maxRetries}
All Retries Failed: YES

Impact:
- New orders may fail due to missing stock records
- Kitchen staff cannot see today's inventory
- Stock management dashboard will show incorrect data
- Order confirmations will be blocked

Immediate Actions Required:
1. Check database connectivity and permissions
2. Verify all menu items are accessible
3. Manually run stock creation: npm run create-stock
4. Review system logs for detailed error traces
5. Check server resources (CPU, Memory, Disk)

Date/Time: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'development'}
Server: ${process.env.SERVER_HOST || 'localhost'}
            `.trim();

            await sendAdminCriticalAlert(
                'DAILY_STOCK_FAILURE',
                alertDetails,
                lastError.stack || lastError.message
            );
            console.log('📧 Critical alert email sent to admin');
        } catch (emailError) {
            console.error('❌ Failed to send admin alert email:', emailError.message);
            console.error('CRITICAL: Stock job failed AND admin notification failed!');
            console.error('Manual intervention required immediately!');
        }
    }

    /**
     * LEGACY: Generate stock records for tomorrow (11 PM the night before)
     * Kept for reference, now handled by createDailyStockRecords at 12:00 AM
     */
    async generateTomorrowStockRecords() {
        try {
            console.log('🔄 Generating tomorrow stock records...');

            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todayStr = today.toISOString().split('T')[0];
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            // Get all today's stock records
            const todayStocks = await DailyStock.findAll({
                where: { stock_date: todayStr }
            });

            let created = 0;

            for (const stock of todayStocks) {
                // Check if tomorrow's record already exists
                const existing = await DailyStock.findOne({
                    where: {
                        menu_item_id: stock.menu_item_id,
                        stock_date: tomorrowStr
                    }
                });

                if (!existing) {
                    // Create tomorrow's record with today's closing as opening
                    await DailyStock.create({
                        menu_item_id: stock.menu_item_id,
                        stock_date: tomorrowStr,
                        opening_quantity: stock.closing_quantity,
                        sold_quantity: 0,
                        adjusted_quantity: 0
                    });
                    created++;
                }
            }

            console.log(`✅ Generated ${created} stock records for tomorrow`);
        } catch (error) {
            console.error('❌ Error generating tomorrow stock records:', error);
        }
    }
}

module.exports = new AutomatedJobsService();
