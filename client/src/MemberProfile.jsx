import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function MemberProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Sort/Filter State
    const [filterType, setFilterType] = useState('all');
    
    // Forms
    const [loanAmount, setLoanAmount] = useState('');
    const [paymentForm, setPaymentForm] = useState({ type: 'savings', amount: '', due_date: '' });

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        axios.get(`http://localhost:8081/member-details/${id}`, { headers: { Authorization: token } })
            .then(res => {
                if(res.data.Error) {
                    setError(res.data.Error);
                } else {
                    setData(res.data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.log(err);
                setError("Failed to connect to server.");
                setLoading(false);
            });
    };

    const handleCreateLoan = () => {
        const token = localStorage.getItem('token');
        axios.post('http://localhost:8081/assign-loan', { user_id: id, amount: loanAmount }, { headers: { Authorization: token } })
            .then(res => {
                if(res.data.Status === "Success") {
                    alert("Loan Created");
                    fetchData();
                } else alert(res.data.Error);
            });
    };

    const handleAssignRecord = (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const payload = { 
            ...paymentForm, 
            user_id: id,
            loan_id: (paymentForm.type === 'loan_payment' && data?.activeLoan) ? data.activeLoan.id : null 
        };

        axios.post('http://localhost:8081/assign-record', payload, { headers: { Authorization: token } })
            .then(res => {
                if(res.data.Status === "Success") {
                    fetchData();
                    setPaymentForm({ ...paymentForm, amount: '', due_date: '' });
                } else alert(res.data.Error);
            });
    };

    const handleMarkPaid = (record) => {
        const token = localStorage.getItem('token');
        axios.put(`http://localhost:8081/mark-paid/${record.id}`, 
            { type: record.type, amount: record.amount, loan_id: record.loan_id, due_date: record.due_date }, 
            { headers: { Authorization: token } })
            .then(res => {
                if(res.data.Status === "Success") fetchData();
            });
    };

    const handleResetStatus = (recordId) => {
        const token = localStorage.getItem('token');
        axios.put(`http://localhost:8081/reset-status/${recordId}`, {}, { headers: { Authorization: token } })
            .then(res => {
                if(res.data.Status === "Success") fetchData();
            });
    };

    const handleCashOut = (type) => {
        if(!window.confirm(`Are you sure you want to cash out all ${type}? This resets the total to 0.`)) return;
        const token = localStorage.getItem('token');
        axios.put('http://localhost:8081/cash-out', { user_id: id, type }, { headers: { Authorization: token } })
            .then(res => {
                if(res.data.Status === "Success") fetchData();
            });
    };

    // --- RENDER SAFETY CHECKS ---
    if (loading) return <div className="p-10 text-center text-gray-500">Loading Profile...</div>;
    
    if (error) return (
        <div className="p-10 text-center">
            <h2 className="text-red-500 text-xl font-bold">Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/dashboard')} className="border-white bg-blue-600 text-white px-4 py-2 rounded">Back to Dashboard</button>
        </div>
    );

    if (!data || !data.user) return <div className="p-10">No Member Data Found.</div>;

    // Helper: Calculate Progress Bar Width
    const loanProgress = data.activeLoan 
        ? ((data.activeLoan.total_amount - data.activeLoan.current_balance) / data.activeLoan.total_amount) * 100 
        : 0;

    // --- FILTER LOGIC ---
    const filteredRecords = data.records.filter(rec => {
        if (filterType === 'all') return true;
        if (filterType === 'loan') return rec.type === 'loan_payment';
        return rec.type === filterType;
    });

    return (
        <div className='min-h-screen p-6'>
            <button onClick={() => navigate('/dashboard')} className='mb-4 p-3 bg-white/0 backdrop-blur-[50px] rounded-[20px] border border-white/50 text-white hover:bg-blue-600'>← Back to Dashboard</button>

            {/* --- PROFILE HEADER --- */}
            <div className='bg-white/0 backdrop-blur-[50px] p-6 rounded-[30px] shadow mb-6 border border-white/50'>
                <h1 className='text-2xl font-bold text-white'>{data.user.full_name}</h1>
                <p className='text-white'>{data.user.phone_number} - <span className='capitalize'>{data.user.role}</span></p>
                {data.user.birthdate && <p className='text-sm text-white'>Born: {new Date(data.user.birthdate).toLocaleDateString()}</p>}
                {data.user.spouse_name && <p className='text-sm text-gray-400'>Spouse: {data.user.spouse_name}</p>}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                
                {/* --- LEFT COL: LOAN MANAGEMENT --- */}
                <div className='space-y-6'>
                    <div className='bg-white/0 backdrop-blur-[50px] p-6 rounded-[30px] shadow border border-white/50'>
                        <h2 className='text-xl font-bold mb-4 text-white'>Loan Tracker</h2>
                        
                        {!data.activeLoan ? (
                            <div className='flex gap-2'>
                                <input type="number" placeholder="Enter Loan Amount" className='border p-2 rounded-[15px] w-full outline-none focus:ring-2 focus:ring-blue-500'
                                    onChange={e => setLoanAmount(e.target.value)} />
                                <button onClick={handleCreateLoan} className='bg-blue-600 text-white px-4 rounded-[15px] font-semibold'>Set Loan</button>
                            </div>
                        ) : (
                            <div>
                                <div className='flex justify-between text-sm mb-1 text-white'>
                                    <span>Paid: ₱{data.activeLoan.total_amount - data.activeLoan.current_balance}</span>
                                    <span>Total: ₱{data.activeLoan.total_amount}</span>
                                </div>
                                <div className='w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden'>
                                    <div className='bg-blue-600 h-4 rounded-full transition-all duration-500' style={{ width: `${loanProgress}%` }}></div>
                                </div>
                                <p className='text-center font-bold text-white text-lg'>Balance: ₱{data.activeLoan.current_balance}</p>
                            </div>
                        )}
                    </div>

                    {/* ASSIGN PAYMENT FORM */}
                    <div className='bg-white/0 backdrop-blur-[50px] p-6 rounded-[30px] shadow border border-white/50'>
                        <h3 className='font-bold mb-3 text-white border-b pb-2'>Assign Payment / Record</h3>
                        <form onSubmit={handleAssignRecord} className='space-y-3'>
                            <div>
                                <label className='text-xs font-bold text-white uppercase'>Transaction Type</label>
                                <select className='w-full border p-2 rounded-[10px] bg-white/50' 
                                    onChange={e => setPaymentForm({...paymentForm, type: e.target.value})}>
                                    <option value="savings">Savings</option>
                                    <option value="insurance">Insurance</option>
                                    {data.activeLoan && <option value="loan_payment">Partial Loan Payment</option>}
                                </select>
                            </div>
                            <div>
                                <label className='text-xs font-bold text-white uppercase'>Amount</label>
                                <input type="number" placeholder="0.00" className='w-full border p-2 rounded-[10px] bg-white/50' required
                                    value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                            </div>
                            <div>
                                <label className='text-xs font-bold text-white uppercase'>Due Date</label>
                                <input type="date" className='w-full p-2 rounded-[10px] bg-white/50' required
                                    value={paymentForm.due_date} onChange={e => setPaymentForm({...paymentForm, due_date: e.target.value})} />
                            </div>
                            <button className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-[15px] font-semibold transition'>Assign Record</button>
                        </form>
                    </div>
                </div>

                {/* --- RIGHT COL: SAVINGS & HISTORY --- */}
                <div className='space-y-6'>
                    {/* TOTALS CARDS */}
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='bg-white/0 backdrop-blur-[50px] p-4 rounded-[30px] shadow border border-white/50 text-center'>
                            <h3 className='text-white text-sm uppercase font-bold'>Total Savings</h3>
                            <p className='text-2xl font-bold text-white'>₱{data.savingsTotal}</p>
                            {Number(data.savingsTotal) > 0 && 
                                <button onClick={() => handleCashOut('savings')} className='mt-2 text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 transition font-bold'>Cash Out</button>
                            }
                        </div>
                        <div className='bg-white/0 backdrop-blur-[50px] p-4 rounded-[30px] shadow border border-white/50 text-center'>
                            <h3 className='text-white text-sm uppercase font-bold'>Total Insurance</h3>
                            <p className='text-2xl font-bold text-white'>₱{data.insuranceTotal}</p>
                            {Number(data.insuranceTotal) > 0 && 
                                <button onClick={() => handleCashOut('insurance')} className='mt-2 text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200 transition font-bold'>Cash Out</button>
                            }
                        </div>
                    </div>

                    {/* HISTORY TABLE */}
                    <div className='bg-white/0 backdrop-blur-[50px] rounded-[30px] shadow overflow-hidden border border-white/50 p-[15px]'>
                        <div className='p-4 border-b bg-white/0 flex justify-between items-center'>
                             <h3 className='font-bold text-white'>Transaction History</h3>
                             {/* --- SORT / FILTER DROPDOWN --- */}
                             <select 
                                className='border bg-white/20 text-white border-gray-300 rounded-[20px] text-sm p-3 focus:outline-none focus:border-blue-500'
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                             >
                                 <option value="all">Show All</option>
                                 <option value="loan">Loans</option>
                                 <option value="savings">Savings</option>
                                 <option value="insurance">Insurance</option>
                             </select>
                        </div>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm text-left'>
                                <thead className='bg-white/10 text-white '>
                                    <tr>
                                        <th className='p-3'>Type</th>
                                        <th className='p-3'>Amount</th>
                                        <th className='p-3'>Due</th>
                                        <th className='p-3'>Status</th>
                                        <th className='p-3'>Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray/50 px-3'>
                                    {filteredRecords.map(rec => (
                                        <tr key={rec.id} className='hover:bg-gray/50'>
                                            <td className='p-3 capitalize text-white'>{rec.type.replace('_', ' ')}</td>
                                            <td className='p-3 font-medium text-white'>₱{rec.amount}</td>
                                            <td className='p-3 text-white'>{new Date(rec.due_date).toLocaleDateString()}</td>
                                            <td className='p-3'>
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    rec.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                    rec.status === 'late' ? 'bg-orange-100 text-orange-700' :
                                                    rec.status === 'cashed_out' ? 'bg-gray-200 text- line-through' : 
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {rec.status}
                                                </span>
                                            </td>
                                            <td className='p-3'>
                                                {rec.status === 'pending' && 
                                                    <button onClick={() => handleMarkPaid(rec)} className='bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs hover:bg-blue-200 font-semibold'>Pay</button>
                                                }
                                                {(rec.status === 'paid' || rec.status === 'late') && 
                                                    <button onClick={() => handleResetStatus(rec.id)} className='text-white hover:text-gray-600 text-xs ml-2 underline'>Undo</button>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredRecords.length === 0 && (
                                        <tr><td colSpan="5" className='p-4 text-center text-white'>No records found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MemberProfile;