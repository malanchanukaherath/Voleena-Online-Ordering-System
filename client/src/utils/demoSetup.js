// Demo setup utilities for Voleena Foods
import { mockApi } from '../services/api';

export const setupDemoData = async () => {
  try {
    // Create sample orders for demo
    const sampleOrders = [
      {
        id: 1,
        customer: { 
          name: 'John Doe', 
          email: 'john@example.com', 
          phone: '+1234567890' 
        },
        items: [
          { name: 'Classic Beef Burger', quantity: 2, price: 250 },
          { name: 'Coca Cola', quantity: 1, price: 58 }
        ],
        total: 558,
        status: 'pending',
        orderType: 'delivery',
        deliveryAddress: '123 Main St, City, State 12345',
        phone: '+1234567890',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
      },
      {
        id: 2,
        customer: { 
          name: 'Jane Smith', 
          email: 'jane@example.com', 
          phone: '+1234567891' 
        },
        items: [
          { name: 'Margherita Pizza', quantity: 1, price: 326 },
          { name: 'Chicken Alfredo', quantity: 1, price: 344 }
        ],
        total: 670,
        status: 'preparing',
        orderType: 'pickup',
        phone: '+1234567891',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        estimatedDelivery: new Date(Date.now() + 20 * 60 * 1000).toISOString() // 20 minutes from now
      },
      {
        id: 3,
        customer: { 
          name: 'Bob Johnson', 
          email: 'bob@example.com', 
          phone: '+1234567892' 
        },
        items: [
          { name: 'Burger Combo', quantity: 1, price: 600 },
          { name: 'Tiramisu', quantity: 1, price: 153 }
        ],
        total: 753,
        status: 'out_for_delivery',
        orderType: 'delivery',
        deliveryAddress: '456 Oak Ave, City, State 12345',
        phone: '+1234567892',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        estimatedDelivery: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now
      },
      {
        id: 4,
        customer: { 
          name: 'Alice Brown', 
          email: 'alice@example.com', 
          phone: '+1234567893' 
        },
        items: [
          { name: 'Pepperoni Pizza', quantity: 1, price: 364 },
          { name: 'Fresh Orange Juice', quantity: 2, price: 96 }
        ],
        total: 556,
        status: 'delivered',
        orderType: 'delivery',
        deliveryAddress: '789 Pine St, City, State 12345',
        phone: '+1234567893',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        deliveredAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        estimatedDelivery: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ];

    // Store sample orders
    localStorage.setItem('voleena_orders', JSON.stringify(sampleOrders));

    // Create additional staff members for demo
    const additionalStaff = [
      {
        id: 1003,
        name: 'Sarah Wilson',
        email: 'sarah@voleena.com',
        role: 'cashier',
        password: 'sarahpass',
        createdAt: new Date().toISOString()
      },
      {
        id: 1004,
        name: 'Mike Chen',
        email: 'mike@voleena.com',
        role: 'kitchen_staff',
        password: 'mikepass',
        createdAt: new Date().toISOString()
      }
    ];

    // Get existing staff and add new ones
    const existingStaff = JSON.parse(localStorage.getItem('voleena_staff') || '[]');
    const allStaff = [...existingStaff, ...additionalStaff];
    localStorage.setItem('voleena_staff', JSON.stringify(allStaff));

    return { success: true, message: 'Demo data setup complete' };
  } catch (error) {
    console.error('Error setting up demo data:', error);
    return { success: false, message: 'Failed to setup demo data' };
  }
};

export const resetDemoData = async () => {
  try {
    // Clear all demo data
    localStorage.removeItem('voleena_orders');
    localStorage.removeItem('voleena_customers');
    localStorage.removeItem('voleena_staff');
    localStorage.removeItem('voleena_menu');
  localStorage.removeItem('voleena_menu_version');
    localStorage.removeItem('voleena_notifications');

    // Re-run the original seeding
    await mockApi.resetDemoData();

    return { success: true, message: 'Demo data reset complete' };
  } catch (error) {
    console.error('Error resetting demo data:', error);
    return { success: false, message: 'Failed to reset demo data' };
  }
};

export const addSampleNotifications = () => {
  const sampleNotifications = [
    {
      id: Date.now() - 1000,
      type: 'order_update',
      title: 'Order #1 Update',
      message: 'Your order is being prepared',
      orderId: 1,
      status: 'preparing',
      priority: 'normal',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: false
    },
    {
      id: Date.now() - 2000,
      type: 'order_update',
      title: 'Order #2 Update',
      message: 'Your order is out for delivery',
      orderId: 2,
      status: 'out_for_delivery',
      priority: 'high',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      read: false
    },
    {
      id: Date.now() - 3000,
      type: 'order_update',
      title: 'Order #3 Delivered',
      message: 'Your order has been delivered successfully',
      orderId: 3,
      status: 'delivered',
      priority: 'high',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      read: false
    }
  ];

  localStorage.setItem('voleena_notifications', JSON.stringify(sampleNotifications));
  return { success: true, message: 'Sample notifications added' };
};
