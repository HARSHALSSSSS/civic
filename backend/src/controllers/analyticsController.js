const Report = require('../models/Report');
const User = require('../models/User');
const logger = require('../config/logger');

// @desc    Get advanced analytics for admin dashboard
// @route   GET /api/reports/analytics/advanced
// @access  Private (Admin/Staff only)
const getAdvancedAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    // Default date range: last 90 days
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Build base match filter
    const baseMatch = {
      createdAt: { $gte: start, $lte: end }
    };
    
    if (category) {
      baseMatch.category = category;
    }

    // Execute all aggregations in parallel using $facet
    const analytics = await Report.aggregate([
      { $match: baseMatch },
      {
        $facet: {
          // Reports by category (distribution)
          byCategory: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                avgPriority: { $avg: '$priority' }
              }
            },
            { $sort: { count: -1 } }
          ],
          
          // Reports by status (progress tracking)
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgPriority: { $avg: '$priority' }
              }
            },
            { $sort: { count: -1 } }
          ],
          
          // Monthly trends (time-series data)
          monthlyTrends: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                count: { $sum: 1 },
                resolved: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0]
                  }
                },
                avgPriority: { $avg: '$priority' }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
          ],
          
          // Average resolution time by category
          resolutionTimeByCategory: [
            {
              $match: {
                status: 'Resolved',
                actualResolutionDate: { $exists: true }
              }
            },
            {
              $group: {
                _id: '$category',
                avgResolutionHours: {
                  $avg: {
                    $divide: [
                      { $subtract: ['$actualResolutionDate', '$createdAt'] },
                      3600000 // Convert ms to hours
                    ]
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { avgResolutionHours: -1 } }
          ],
          
          // Priority distribution
          byPriority: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 },
                byStatus: {
                  $push: {
                    status: '$status',
                    count: 1
                  }
                }
              }
            },
            { $sort: { _id: 1 } }
          ],
          
          // Total statistics
          totalStats: [
            {
              $group: {
                _id: null,
                totalReports: { $sum: 1 },
                totalResolved: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0]
                  }
                },
                totalRejected: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0]
                  }
                },
                avgPriority: { $avg: '$priority' },
                highPriorityCount: {
                  $sum: {
                    $cond: [{ $gte: ['$priority', 4] }, 1, 0]
                  }
                }
              }
            }
          ],
          
          // Top supported reports (community engagement)
          topSupported: [
            {
              $match: { supportCount: { $gt: 0 } }
            },
            {
              $project: {
                reportId: 1,
                title: 1,
                category: 1,
                supportCount: 1,
                status: 1
              }
            },
            { $sort: { supportCount: -1 } },
            { $limit: 10 }
          ],
          
          // Staff performance (for staff/admin view)
          staffPerformance: [
            {
              $match: {
                assignedStaffId: { $exists: true, $ne: null }
              }
            },
            {
              $group: {
                _id: '$assignedStaffId',
                assignedCount: { $sum: 1 },
                resolvedCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0]
                  }
                },
                inProgressCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0]
                  }
                },
                avgResolutionHours: {
                  $avg: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$status', 'Resolved'] },
                          { $exists: '$actualResolutionDate' }
                        ]
                      },
                      {
                        $divide: [
                          { $subtract: ['$actualResolutionDate', '$createdAt'] },
                          3600000
                        ]
                      },
                      null
                    ]
                  }
                }
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'staff'
              }
            },
            {
              $unwind: '$staff'
            },
            {
              $project: {
                staffId: '$staff._id',
                staffName: '$staff.name',
                staffDepartment: '$staff.department',
                assignedCount: 1,
                resolvedCount: 1,
                inProgressCount: 1,
                avgResolutionHours: { $round: ['$avgResolutionHours', 2] },
                resolutionRate: {
                  $cond: [
                    { $gt: ['$assignedCount', 0] },
                    { $round: [{ $multiply: [{ $divide: ['$resolvedCount', '$assignedCount'] }, 100] }, 2] },
                    0
                  ]
                }
              }
            },
            { $sort: { resolvedCount: -1 } }
          ]
        }
      }
    ]);

    // Extract facet results
    const result = analytics[0] || {};
    
    // Calculate derived statistics
    const totalStats = result.totalStats?.[0] || {};
    const resolutionRate = totalStats.totalReports > 0
      ? ((totalStats.totalResolved / totalStats.totalReports) * 100).toFixed(2)
      : 0;

    // Format response
    const response = {
      success: true,
      data: {
        summary: {
          totalReports: totalStats.totalReports || 0,
          totalResolved: totalStats.totalResolved || 0,
          totalRejected: totalStats.totalRejected || 0,
          resolutionRate: parseFloat(resolutionRate),
          avgPriority: totalStats.avgPriority?.toFixed(2) || 0,
          highPriorityCount: totalStats.highPriorityCount || 0
        },
        byCategory: result.byCategory?.map(c => ({
          category: c._id,
          count: c.count,
          avgPriority: c.avgPriority?.toFixed(2) || 0
        })) || [],
        byStatus: result.byStatus?.map(s => ({
          status: s._id,
          count: s.count,
          avgPriority: s.avgPriority?.toFixed(2) || 0
        })) || [],
        monthlyTrends: result.monthlyTrends?.map(m => ({
          year: m._id.year,
          month: m._id.month,
          monthName: new Date(m._id.year, m._id.month - 1).toLocaleString('default', { month: 'short' }),
          count: m.count,
          resolved: m.resolved,
          avgPriority: m.avgPriority?.toFixed(2) || 0
        })) || [],
        resolutionTimeByCategory: result.resolutionTimeByCategory?.map(r => ({
          category: r._id,
          avgResolutionHours: r.avgResolutionHours?.toFixed(2) || 0,
          count: r.count
        })) || [],
        byPriority: result.byPriority?.map(p => ({
          priority: p._id,
          count: p.count
        })) || [],
        topSupported: result.topSupported || [],
        staffPerformance: result.staffPerformance || []
      },
      filters: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        category: category || 'all'
      }
    };

    res.json(response);

  } catch (error) {
    logger.error(`Advanced analytics error: ${error.message}`);
    next(error);
  }
};

// @desc    Get simple stats for dashboard
// @route   GET /api/reports/analytics/stats
// @access  Public
const getStats = async (req, res, next) => {
  try {
    const stats = await Report.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'Submitted'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
          },
          closed: {
            $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0
      }
    });

  } catch (error) {
    logger.error(`Stats error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getAdvancedAnalytics,
  getStats
};
