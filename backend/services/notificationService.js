const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  // Create a swap request notification
  static async notifySwapRequest(swapData) {
    try {
      await Notification.createNotification({
        recipient: swapData.provider,
        sender: swapData.requester,
        type: 'swap_request',
        title: 'New Swap Request',
        message: `${swapData.requesterName} wants to exchange ${swapData.skillOffered} for ${swapData.skillRequested}`,
        data: {
          swapId: swapData.swapId
        },
        priority: 'medium',
        actionUrl: `/swaps/${swapData.swapId}`
      });
    } catch (error) {
      console.error('Error creating swap request notification:', error);
    }
  }

  // Create swap acceptance notification
  static async notifySwapAccepted(swapData) {
    try {
      await Notification.createNotification({
        recipient: swapData.requester,
        sender: swapData.provider,
        type: 'swap_accepted',
        title: 'Swap Request Accepted!',
        message: `${swapData.providerName} accepted your swap request for ${swapData.skillRequested}`,
        data: {
          swapId: swapData.swapId
        },
        priority: 'high',
        actionUrl: `/swaps/${swapData.swapId}`
      });
    } catch (error) {
      console.error('Error creating swap accepted notification:', error);
    }
  }

  // Create swap rejection notification
  static async notifySwapRejected(swapData) {
    try {
      await Notification.createNotification({
        recipient: swapData.requester,
        sender: swapData.provider,
        type: 'swap_rejected',
        title: 'Swap Request Declined',
        message: `${swapData.providerName} declined your swap request for ${swapData.skillRequested}`,
        data: {
          swapId: swapData.swapId
        },
        priority: 'medium',
        actionUrl: `/swaps/${swapData.swapId}`
      });
    } catch (error) {
      console.error('Error creating swap rejected notification:', error);
    }
  }

  // Create swap completion notification
  static async notifySwapCompleted(swapData) {
    try {
      // Notify both users
      await Promise.all([
        Notification.createNotification({
          recipient: swapData.requester,
          sender: swapData.provider,
          type: 'swap_completed',
          title: 'Swap Completed!',
          message: `Your swap with ${swapData.providerName} has been completed. Please leave feedback!`,
          data: {
            swapId: swapData.swapId
          },
          priority: 'high',
          actionUrl: `/swaps/${swapData.swapId}/feedback`
        }),
        Notification.createNotification({
          recipient: swapData.provider,
          sender: swapData.requester,
          type: 'swap_completed',
          title: 'Swap Completed!',
          message: `Your swap with ${swapData.requesterName} has been completed. Please leave feedback!`,
          data: {
            swapId: swapData.swapId
          },
          priority: 'high',
          actionUrl: `/swaps/${swapData.swapId}/feedback`
        })
      ]);
    } catch (error) {
      console.error('Error creating swap completed notifications:', error);
    }
  }

  // Create swap cancellation notification
  static async notifySwapCancelled(swapData) {
    try {
      const recipient = swapData.cancelledBy === swapData.requester ? swapData.provider : swapData.requester;
      const cancellerName = swapData.cancelledBy === swapData.requester ? swapData.requesterName : swapData.providerName;

      await Notification.createNotification({
        recipient,
        sender: swapData.cancelledBy,
        type: 'swap_cancelled',
        title: 'Swap Cancelled',
        message: `${cancellerName} cancelled the swap for ${swapData.skillRequested}`,
        data: {
          swapId: swapData.swapId,
          metadata: { reason: swapData.reason }
        },
        priority: 'medium',
        actionUrl: `/swaps/${swapData.swapId}`
      });
    } catch (error) {
      console.error('Error creating swap cancelled notification:', error);
    }
  }

  // Create feedback received notification
  static async notifyFeedbackReceived(feedbackData) {
    try {
      await Notification.createNotification({
        recipient: feedbackData.recipient,
        sender: feedbackData.sender,
        type: 'feedback_received',
        title: 'New Feedback Received',
        message: `You received ${feedbackData.rating} stars from ${feedbackData.senderName}`,
        data: {
          swapId: feedbackData.swapId,
          metadata: { rating: feedbackData.rating }
        },
        priority: 'medium',
        actionUrl: `/profile/feedback`
      });
    } catch (error) {
      console.error('Error creating feedback notification:', error);
    }
  }

  // Create message received notification
  static async notifyMessageReceived(messageData) {
    try {
      await Notification.createNotification({
        recipient: messageData.recipient,
        sender: messageData.sender,
        type: 'message_received',
        title: 'New Message',
        message: `${messageData.senderName} sent you a message about your swap`,
        data: {
          swapId: messageData.swapId
        },
        priority: 'medium',
        actionUrl: `/swaps/${messageData.swapId}/messages`
      });
    } catch (error) {
      console.error('Error creating message notification:', error);
    }
  }

  // Create skill status notification
  static async notifySkillStatus(skillData) {
    try {
      const isApproved = skillData.status === 'approved';
      
      await Notification.createNotification({
        recipient: skillData.submittedBy,
        type: isApproved ? 'skill_approved' : 'skill_rejected',
        title: isApproved ? 'Skill Approved!' : 'Skill Submission Update',
        message: isApproved 
          ? `Your skill "${skillData.skillName}" has been approved and is now available!`
          : `Your skill "${skillData.skillName}" needs revision: ${skillData.reason}`,
        data: {
          skillId: skillData.skillId,
          metadata: { reason: skillData.reason }
        },
        priority: isApproved ? 'high' : 'medium',
        actionUrl: isApproved ? '/skills/manage' : '/skills/submit'
      });
    } catch (error) {
      console.error('Error creating skill status notification:', error);
    }
  }

  // Create platform-wide notification
  static async notifyPlatformMessage(messageData) {
    try {
      // Get target users based on audience
      let users = [];
      
      switch (messageData.targetAudience) {
        case 'all':
          users = await User.find({ isActive: true }).select('_id');
          break;
        case 'new_users':
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          users = await User.find({ 
            isActive: true, 
            joinedAt: { $gte: thirtyDaysAgo } 
          }).select('_id');
          break;
        case 'active_users':
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          users = await User.find({ 
            isActive: true, 
            updatedAt: { $gte: sevenDaysAgo } 
          }).select('_id');
          break;
      }

      // Create notifications for all target users
      const notifications = users.map(user => ({
        recipient: user._id,
        type: 'platform_message',
        title: messageData.title,
        message: messageData.content,
        data: {
          messageId: messageData.messageId
        },
        priority: messageData.priority,
        expiresAt: messageData.expiresAt
      }));

      await Notification.insertMany(notifications);
    } catch (error) {
      console.error('Error creating platform notifications:', error);
    }
  }

  // Create account status notification
  static async notifyAccountStatus(accountData) {
    try {
      const isBanned = accountData.status === 'banned';
      
      await Notification.createNotification({
        recipient: accountData.userId,
        type: isBanned ? 'account_banned' : 'account_unbanned',
        title: isBanned ? 'Account Suspended' : 'Account Restored',
        message: isBanned 
          ? `Your account has been suspended: ${accountData.reason}`
          : 'Your account has been restored and is now active',
        data: {
          metadata: { reason: accountData.reason }
        },
        priority: 'urgent',
        actionUrl: '/support'
      });
    } catch (error) {
      console.error('Error creating account status notification:', error);
    }
  }

  // Get user notifications with pagination
  static async getUserNotifications(userId, options = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options;
      const skip = (page - 1) * limit;

      const query = { recipient: userId };
      if (unreadOnly) {
        query.isRead = false;
      }

      const notifications = await Notification.find(query)
        .populate('sender', 'name profilePhoto')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({ 
        recipient: userId, 
        isRead: false 
      });

      return {
        notifications,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        },
        unreadCount
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.markAsRead();
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { 
          isRead: true, 
          readAt: new Date() 
        }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
