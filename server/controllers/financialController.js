const Financial = require('../models/financialModel');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');

// --- HELPER: Calculate Next Date based on Day Name ---
function getNextDayOfWeek(startDate, dayName) {
    const dayMap = {
        "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3,
        "Thursday": 4, "Friday": 5, "Saturday": 6
    };
    
    const resultDate = new Date(startDate.getTime());
    resultDate.setHours(0,0,0,0);

    const targetDay = dayMap[dayName];
    const currentDay = resultDate.getDay();
    
    // Calculate days to add. If today is the target day, we schedule for next week (7 days later)
    let distance = (targetDay + 7 - currentDay) % 7;
    if (distance === 0) distance = 7;
    
    resultDate.setDate(resultDate.getDate() + distance);
    return resultDate;
}

// --- LOANS ---
exports.assignLoan = (req, res) => {
    if (req.user.role !== 'leader') return res.json({ Error: "Access Denied" });
    
    // Destructure new inputs: weeks, payment_day, weekly_amount
    const { user_id, amount, loan_name, weeks, payment_day, weekly_amount } = req.body;

    Financial.findActiveLoan(user_id, (err, result) => {
        if (result.length > 0) return res.json({ Error: "Member already has an active loan." });

        const loanData = { 
            user_id, 
            amount, 
            loan_name: loan_name || 'Personal Loan',
            weeks_to_pay: weeks,       // Save terms to DB
            payment_day: payment_day,  // Save preferred day to DB
            weekly_amount: weekly_amount
        };

        Financial.createLoan(loanData, (err, loanResult) => {
            if (err) return res.json({ Error: "Database Error" });

            // GET THE NEW LOAN ID (Assuming standard MySQL result structure)
            const newLoanId = loanResult.insertId;

            // --- AUTOMATIC SCHEDULE GENERATION ---
            // Create a pending record for every week based on the terms
            let currentDateTracker = new Date();
            
            // Loop through the number of weeks
            for(let i = 0; i < weeks; i++) {
                currentDateTracker = getNextDayOfWeek(currentDateTracker, payment_day);
                
                const recordData = {
                    user_id: user_id,
                    type: 'loan_payment',
                    amount: weekly_amount,
                    due_date: currentDateTracker.toISOString().split('T')[0], // Format YYYY-MM-DD
                    loan_id: newLoanId,
                    status: 'pending' // These will show up in history immediately
                };

                // Insert record (Fire and forget for loop speed, or use Promise.all in production)
                Financial.createRecord(recordData, () => {});
            }

            // Notifications
            User.findById(user_id, (err, userRes) => {
                const memberName = userRes[0]?.full_name || "Member";
                const memberMsg = `New Loan: ${loanData.loan_name} - ₱${amount}. Payable in ${weeks} weeks (₱${weekly_amount}/week).`;
                const adminMsg = `You assigned Loan (${loanData.loan_name}) to ${memberName}`;
                
                Notification.create(user_id, memberMsg, () => {});
                Notification.create(req.user.id, adminMsg, () => {});
                
                return res.json({ Status: "Success" });
            });
        });
    });
};

// --- NEW: DELETE LOAN ---
exports.deleteActiveLoan = (req, res) => {
    if (req.user.role !== 'leader') return res.json({ Error: "Access Denied" });
    const loanId = req.params.loanId;

    // Call Model to delete loan. 
    // NOTE: Ensure your SQL Model also deletes associated financial_records OR you use ON DELETE CASCADE in your database schema.
    Financial.deleteLoan(loanId, (err) => {
        if(err) return res.json({ Error: "Error deleting loan" });
        return res.json({ Status: "Success" });
    });
};

// --- RECORDS ---
exports.assignRecord = (req, res) => {
    if (req.user.role !== 'leader') return res.json({ Error: "Access Denied" });
    const { user_id, type, amount, due_date, loan_id } = req.body;

    const data = { user_id, type, amount, due_date, loan_id: loan_id || null };
    Financial.createRecord(data, (err) => {
        if (err) return res.json({ Error: "Database Error" });

        // Notifications
        User.findById(user_id, (err, userRes) => {
            const memberName = userRes[0]?.full_name || "Member";
            let typeText = type === 'loan_payment' ? 'Loan Payment' : (type === 'savings' ? 'Savings' : 'Insurance');
            const memberMsg = `Reminder: ${typeText} of ₱${amount} is due on ${due_date}`;
            const adminMsg = `You assigned a ${typeText} (₱${amount}) to ${memberName}`;

            Notification.create(user_id, memberMsg, () => {});
            Notification.create(req.user.id, adminMsg, () => {});

            res.json({ Status: "Success" });
        });
    });
};

exports.markPaid = (req, res) => {
    if (req.user.role !== 'leader') return res.json({ Error: "Access Denied" });
    
    Financial.findById(req.params.id, (err, result) => {
        if (err || result.length === 0) return res.json({ Error: "Record not found" });
        const record = result[0];

        if (['paid', 'late', 'cashed_out'].includes(record.status)) return res.json({ Error: "Already paid" });

        const today = new Date();
        const due = new Date(record.due_date);
        today.setHours(0,0,0,0); due.setHours(0,0,0,0);
        const newStatus = today > due ? 'late' : 'paid';

        Financial.updateStatus(req.params.id, newStatus, (err) => {
            if (err) return res.json({ Error: "Error updating record" });

            if (record.type === 'loan_payment' && record.loan_id) {
                Financial.updateLoanBalance(record.loan_id, record.amount, '-', (err) => {
                    Financial.closeLoan(record.loan_id, () => {});
                    return res.json({ Status: "Success" });
                });
            } else {
                return res.json({ Status: "Success" });
            }
        });
    });
};

exports.resetStatus = (req, res) => {
    if (req.user.role !== 'leader') return res.json({ Error: "Access Denied" });
    
    Financial.findById(req.params.id, (err, result) => {
        if (err || result.length === 0) return res.json({ Error: "Record not found" });
        const record = result[0];

        if (record.type === 'loan_payment' && record.loan_id && ['paid', 'late'].includes(record.status)) {
            Financial.updateLoanBalance(record.loan_id, record.amount, '+', () => {
                Financial.reactivateLoan(record.loan_id, () => {
                    Financial.updateStatus(req.params.id, 'pending', () => res.json({ Status: "Success" }));
                });
            });
        } else {
            Financial.updateStatus(req.params.id, 'pending', () => res.json({ Status: "Success" }));
        }
    });
};

exports.deleteRecord = (req, res) => {
    if (req.user.role !== 'leader') return res.json({ Error: "Access Denied" });
    
    Financial.findById(req.params.id, (err, result) => {
        if (err || result.length === 0) return res.json({ Error: "Record not found" });
        const record = result[0];

        if (record.type === 'loan_payment' && record.loan_id && ['paid', 'late'].includes(record.status)) {
            Financial.updateLoanBalance(record.loan_id, record.amount, '+', () => {
                Financial.reactivateLoan(record.loan_id, () => {
                    Financial.deleteRecord(req.params.id, () => res.json({ Status: "Success" }));
                });
            });
        } else {
            Financial.deleteRecord(req.params.id, () => res.json({ Status: "Success" }));
        }
    });
};

exports.cashOut = (req, res) => {
    if (req.user.role !== 'leader') return res.json({ Error: "Access Denied" });
    Financial.cashOut(req.body.user_id, req.body.type, (err) => {
        if (err) return res.json({ Error: "Error cashing out" });
        return res.json({ Status: "Success" });
    });
};

exports.getMemberDetails = (req, res) => {
    const userId = req.params.id;
    if (req.user.role !== 'leader' && req.user.id != userId) return res.json({ Error: "Access Denied" });

    User.findById(userId, (err, userRes) => {
        if (err || userRes.length === 0) return res.json({ Error: "User not found" });
        const user = userRes[0];
        
        if (user.role === 'leader') { 
            delete user.profile_picture; delete user.birthdate; delete user.spouse_name; 
        }

        Financial.findActiveLoan(userId, (err, loanRes) => {
            Financial.getRecordsByUser(userId, (err, recordRes) => {
                Notification.getByUser(userId, (err, notifRes) => {
                    Financial.getTotals(userId, (err, totals) => {
                        return res.json({
                            user,
                            activeLoan: loanRes[0] || null,
                            records: recordRes,
                            notifications: notifRes,
                            savingsTotal: totals.savings,
                            insuranceTotal: totals.insurance
                        });
                    });
                });
            });
        });
    });
};

exports.getMyRecords = (req, res) => {
    if (req.user.id != req.params.id && req.user.role !== 'leader') return res.json({ Error: "Access Denied" });
    Financial.getRecordsByUser(req.params.id, (err, result) => {
        return res.json({ Result: result });
    });
};

exports.markNotificationRead = (req, res) => {
    Notification.markRead(req.params.id, () => res.json({ Status: "Success" }));
};