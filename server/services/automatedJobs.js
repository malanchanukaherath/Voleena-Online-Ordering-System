const cron = require('node-cron');
const { ComboPack, DailyStock, MenuItem, Order, TokenBlacklist, sequelize } = require('../models');
const { Op } = require('sequelize');
const stockService = require('../services/stockService');

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
     */
    start() {
        console.log('🤖 Starting automated jobs...');

        // Job 1: Activate/deactivate combo packs based on schedule (FR19)
        this.jobs.push(
            cron.schedule('0 0 * * *', async () => {
                await this.updateComboPackSchedules();
            })
        );

        // Job 2: Auto-disable out-of-stock menu items (FR25)
        this.jobs.push(
            cron.schedule('*/15 * * * *', async () => {
                await this.autoDisableOutOfStockItems();
            })
        );

        // Job 3: Auto-cancel unconfirmed orders
        this.jobs.push(
            cron.schedule('*/10 * * * *', async () => {
                await this.autoCancelUnconfirmedOrders();
            })
        );

        // Job 4: Clean expired blacklisted tokens
        this.jobs.push(
            cron.schedule('0 */6 * * *', async () => {
                await this.cleanExpiredTokens();
            })
        );

        // Job 5: Generate daily stock records for tomorrow
        this.jobs.push(
            cron.schedule('0 23 * * *', async () => {
                await this.generateTomorrowStockRecords();
            })
        );

        console.log('✅ Automated jobs started');
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
     * Auto-cancel unconfirmed orders
     */
    async autoCancelUnconfirmedOrders() {
        try {
            const timeoutMinutes = parseInt(process.env.ORDER_AUTO_CANCEL_MINUTES) || 30;
            const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

            const ordersToCancel = await Order.findAll({
                where: {
                    status: 'PENDING',
                    created_at: {
                        [Op.lt]: cutoffTime
                    }
                }
            });

            for (const order of ordersToCancel) {
                await order.update({
                    status: 'CANCELLED',
                    cancelled_at: new Date(),
                    cancellation_reason: `Auto-cancelled after ${timeoutMinutes} minutes without confirmation`,
                    cancelled_by: 'SYSTEM'
                });

                // Log status history
                const { OrderStatusHistory } = require('../models');
                await OrderStatusHistory.create({
                    order_id: order.order_id,
                    old_status: 'PENDING',
                    new_status: 'CANCELLED',
                    changed_by: null,
                    changed_by_type: 'SYSTEM',
                    notes: 'Auto-cancelled due to timeout'
                });
            }

            if (ordersToCancel.length > 0) {
                console.log(`✅ Auto-cancelled ${ordersToCancel.length} unconfirmed orders`);
            }
        } catch (error) {
            console.error('❌ Error auto-cancelling orders:', error);
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
        } catch (error) {
            console.error('❌ Error cleaning expired tokens:', error);
        }
    }

    /**
     * Generate stock records for tomorrow
     * Carries forward today's closing stock as tomorrow's opening stock
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
