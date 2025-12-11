import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function MemberProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterType, setFilterType] = useState('all');
    
    // --- EDIT STATES ---
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ full_name: '', phone_number: '', birthdate: '', spouse_name: '' });
    
    // NEW: Auth Update State (For Admin changing Member credentials)
    const [authForm, setAuthForm] = useState({ new_phone: '', new_password: '' });
    const userRole = localStorage.getItem('role');

    // --- FINANCIAL FORMS ---
    const [loanAmount, setLoanAmount] = useState('');
    const [loanName, setLoanName] = useState('');
    const [paymentForm, setPaymentForm] = useState({ type: 'savings', amount: '', due_date: '' });

    useEffect(() => { fetchData(); }, [id]);

    const fetchData = () => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/');

        axios.get(`http://localhost:8081/member-details/${id}`, { headers: { Authorization: token } })
            .then(res => {
                if(res.data.Error) setError(res.data.Error);
                else {
                    setData(res.data);
                    setEditForm({
                        full_name: res.data.user.full_name,
                        phone_number: res.data.user.phone_number,
                        birthdate: res.data.user.birthdate ? res.data.user.birthdate.split('T')[0] : '',
                        spouse_name: res.data.user.spouse_name || ''
                    });
                    // Initialize auth form with current phone
                    setAuthForm({ new_phone: res.data.user.phone_number, new_password: '' });
                }
                setLoading(false);
            })
            .catch(err => {
                console.log(err);
                setError("Failed to connect to server.");
                setLoading(false);
            });
    };

    // --- EDIT HANDLERS ---
    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleAuthChange = (e) => {
        setAuthForm({ ...authForm, [e.target.name]: e.target.value });
    };

    const handleSaveMember = () => {
        const token = localStorage.getItem('token');
        
        // 1. Update Personal Details
        axios.put(`http://localhost:8081/update-member/${id}`, editForm, { headers: { Authorization: token } })
            .then(res => {
                if(res.data.Status === "Success") {
                    
                    // 2. Update Auth (Phone/Pass) if changed
                    if (authForm.new_password || authForm.new_phone !== data.user.phone_number) {
                        axios.put(`http://localhost:8081/update-member-auth/${id}`, authForm, { headers: { Authorization: token } })
                            .then(authRes => {
                                if (authRes.data.Status === "Success") {
                                    alert("Profile & Credentials updated successfully!");
                                    setIsEditing(false);
                                    fetchData();
                                } else {
                                    alert("Profile updated, but Auth failed: " + authRes.data.Error);
                                }
                            });
                    } else {
                        alert("Profile updated successfully!");
                        setIsEditing(false);
                        fetchData();
                    }
                } else {
                    alert("Error updating member details");
                }
            });
    };

    // --- FINANCIAL HANDLERS ---
    const handleCreateLoan = () => {
        const token = localStorage.getItem('token');
        if(!loanAmount) return alert("Please enter an amount");
        axios.post('http://localhost:8081/assign-loan', { user_id: id, amount: loanAmount, loan_name: loanName }, { headers: { Authorization: token } })
            .then(res => {
                if(res.data.Status === "Success") { alert("Loan Created"); setLoanAmount(''); setLoanName(''); fetchData(); } 
                else alert(res.data.Error);
            });
    };

    const handleAssignRecord = (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const payload = { ...paymentForm, user_id: id, loan_id: (paymentForm.type === 'loan_payment' && data?.activeLoan) ? data.activeLoan.id : null };
        axios.post('http://localhost:8081/assign-record', payload, { headers: { Authorization: token } })
            .then(res => {
                if(res.data.Status === "Success") { fetchData(); setPaymentForm({ ...paymentForm, amount: '', due_date: '' }); } 
                else alert(res.data.Error);
            });
    };

    const handleMarkPaid = (recordId) => {
        const token = localStorage.getItem('token');
        axios.put(`http://localhost:8081/mark-paid/${recordId}`, {}, { headers: { Authorization: token } }).then(res => { if(res.data.Status === "Success") fetchData(); });
    };
    const handleResetStatus = (recordId) => {
        const token = localStorage.getItem('token');
        axios.put(`http://localhost:8081/reset-status/${recordId}`, {}, { headers: { Authorization: token } }).then(res => { if(res.data.Status === "Success") fetchData(); });
    };
    const handleCancelTransaction = (recordId) => {
        if(!window.confirm("CANCEL transaction?")) return;
        const token = localStorage.getItem('token');
        axios.delete(`http://localhost:8081/delete-record/${recordId}`, { headers: { Authorization: token } }).then(res => { if(res.data.Status === "Success") fetchData(); else alert("Error cancelling"); });
    };
    const handleCashOut = (type) => {
        if(!window.confirm(`Cash out ${type}?`)) return;
        const token = localStorage.getItem('token');
        axios.put('http://localhost:8081/cash-out', { user_id: id, type }, { headers: { Authorization: token } }).then(res => { if(res.data.Status === "Success") fetchData(); });
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
    if (!data || !data.user) return <div className="p-10">No Data.</div>;

    const loanProgress = data.activeLoan ? ((data.activeLoan.total_amount - data.activeLoan.current_balance) / data.activeLoan.total_amount) * 100 : 0;
    const filteredRecords = data.records.filter(rec => filterType === 'all' ? true : (filterType === 'loan' ? rec.type === 'loan_payment' : rec.type === filterType));

    return (
        <div className='min-h-screen p-6'>
            <button onClick={() => navigate('/dashboard')} className='mb-4 p-3 bg-white/0 backdrop-blur-[50px] rounded-[20px] border border-white/50 text-white hover:bg-blue-600 transition'>← Back to Dashboard</button>

            {/* --- PROFILE HEADER & EDIT SECTION --- */}
            <div className='bg-white/0 backdrop-blur-[50px] p-6 rounded-[30px] shadow mb-6 border border-white/50 flex flex-col md:flex-row gap-6 items-center md:items-start'>
                <div className='w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-sm flex-shrink-0 bg-gray-200'>
                    {data.user.profile_picture ? <img src={`http://localhost:8081/images/${data.user.profile_picture}`} alt="Profile" className='w-full h-full object-cover'/> : <div className='w-full h-full flex items-center justify-center text-gray-400'>No Img</div>}
                </div>

                <div className='flex-1 w-full'>
                    {!isEditing ? (
                        <div className='flex justify-between items-start'>
                            <div className='text-white space-y-1'>
                                <h1 className='text-2xl font-bold'>{data.user.full_name}</h1>
                                <p className='text-white/80'>{data.user.phone_number} - <span className='capitalize'>{data.user.role}</span></p>
                                {data.user.birthdate && <p className='text-sm text-white/70'>Born: {new Date(data.user.birthdate).toLocaleDateString()}</p>}
                                {data.user.spouse_name && <p className='text-sm text-white/70'>Spouse: {data.user.spouse_name}</p>}
                            </div>
                            {userRole === 'leader' && (
                                <button onClick={() => setIsEditing(true)} className='bg-white/10 border border-white text-white px-4 py-2 rounded-[10px] hover:bg-white/20 transition'>Edit Profile</button>
                            )}
                        </div>
                    ) : (
                        <div className='space-y-4 bg-white/10 p-4 rounded-[20px] border border-white/20'>
                            <h3 className='text-white font-bold border-b border-white/20 pb-2'>Personal Details</h3>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div><label className='text-xs font-bold text-white uppercase'>Name</label><input type="text" name="full_name" value={editForm.full_name} onChange={handleEditChange} className='w-full p-2 rounded-[10px] bg-white/80 text-gray-800' /></div>
                                <div><label className='text-xs font-bold text-white uppercase'>Birthdate</label><input type="date" name="birthdate" value={editForm.birthdate} onChange={handleEditChange} className='w-full p-2 rounded-[10px] bg-white/80 text-gray-800' /></div>
                                <div><label className='text-xs font-bold text-white uppercase'>Spouse</label><input type="text" name="spouse_name" value={editForm.spouse_name} onChange={handleEditChange} className='w-full p-2 rounded-[10px] bg-white/80 text-gray-800' /></div>
                            </div>

                            {/* NEW: AUTHENTICATION UPDATE SECTION */}
                            <h3 className='text-white font-bold border-b border-white/20 pb-2 pt-2'>Login Credentials (Admin Only)</h3>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div>
                                    <label className='text-xs font-bold text-white uppercase'>New Phone Number</label>
                                    <input type="text" name="new_phone" value={authForm.new_phone} onChange={handleAuthChange} className='w-full p-2 rounded-[10px] bg-white/80 text-gray-800' placeholder="Update Phone" />
                                </div>
                                <div>
                                    <label className='text-xs font-bold text-white uppercase'>New Password</label>
                                    <input type="password" name="new_password" value={authForm.new_password} onChange={handleAuthChange} className='w-full p-2 rounded-[10px] bg-white/80 text-gray-800' placeholder="Set New Password (Strong)" />
                                    <p className='text-[10px] text-white/60 mt-1'>Must contain 8+ chars, uppercase, number & special char.</p>
                                </div>
                            </div>

                            <div className='flex gap-2 mt-4'>
                                <button onClick={handleSaveMember} className='bg-green-600 text-white px-4 py-2 rounded-[10px] hover:bg-green-700 font-semibold'>Save All Changes</button>
                                <button onClick={() => setIsEditing(false)} className='bg-gray-500 text-white px-4 py-2 rounded-[10px] hover:bg-gray-600'>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* LOAN TRACKER */}
                <div className='space-y-6'>
                    <div className='bg-white/0 backdrop-blur-[50px] p-6 rounded-[30px] shadow border border-white/50'>
                        <h2 className='text-xl font-bold mb-4 text-white'>Loan Tracker</h2>
                        {!data.activeLoan ? (
                            <div className='flex flex-col gap-3'>
                                <input type="text" placeholder="Loan Name" className='border p-2 rounded-[15px] w-full outline-none' value={loanName} onChange={e => setLoanName(e.target.value)} />
                                <div className='flex gap-2'>
                                    <input type="number" placeholder="Enter Amount" className='border p-2 rounded-[15px] w-full outline-none' value={loanAmount} onChange={e => setLoanAmount(e.target.value)} />
                                    <button onClick={handleCreateLoan} className='bg-blue-600 text-white px-4 rounded-[15px] font-semibold hover:bg-blue-700'>Set Loan</button>
                                </div>
                            </div>
                        ) : (
                            <div className='text-center'>
                                <h3 className='text-white font-bold text-lg mb-2 border-b border-white/20 pb-2'>{data.activeLoan.loan_name || 'Active Loan'}</h3>
                                <div className='py-4'><span className='text-6xl font-extrabold text-white drop-shadow-md'>{Math.round(loanProgress)}%</span><p className='text-white/70 uppercase tracking-widest text-sm mt-2'>Loan Paid</p></div>
                                <div className='flex justify-between items-center border-t border-white/20 pt-4 mt-2 text-white'>
                                    <div className='text-left'><p className='text-xs text-white/60 uppercase'>Total</p><p className='font-bold text-lg'>₱{data.activeLoan.total_amount}</p></div>
                                    <div className='text-right'><p className='text-xs text-white/60 uppercase'>Balance</p><p className='font-bold text-lg'>₱{data.activeLoan.current_balance}</p></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className='bg-white/0 backdrop-blur-[50px] p-6 rounded-[30px] shadow border border-white/50'>
                        <h3 className='font-bold mb-3 text-white border-b border-white/20 pb-2'>Assign Payment / Record</h3>
                        <form onSubmit={handleAssignRecord} className='space-y-3'>
                            <div><label className='text-xs font-bold text-white uppercase'>Type</label><select className='w-full border p-2 rounded-[10px] bg-white/80 text-gray-800' onChange={e => setPaymentForm({...paymentForm, type: e.target.value})}><option value="savings">Savings</option><option value="insurance">Insurance</option>{data.activeLoan && <option value="loan_payment">Partial Loan Payment</option>}</select></div>
                            <div><label className='text-xs font-bold text-white uppercase'>Amount</label><input type="number" className='w-full border p-2 rounded-[10px] bg-white/80 text-gray-800' required value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} /></div>
                            <div><label className='text-xs font-bold text-white uppercase'>Due</label><input type="date" className='w-full p-2 rounded-[10px] bg-white/80 text-gray-800' required value={paymentForm.due_date} onChange={e => setPaymentForm({...paymentForm, due_date: e.target.value})} /></div>
                            <button className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-[15px] font-semibold transition shadow-md'>Assign Record</button>
                        </form>
                    </div>
                </div>

                {/* HISTORY */}
                <div className='space-y-6'>
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='bg-white/0 backdrop-blur-[50px] p-4 rounded-[30px] shadow border border-white/50 text-center'><h3 className='text-white text-sm uppercase font-bold'>Savings</h3><p className='text-2xl font-bold text-white'>₱{data.savingsTotal}</p>{Number(data.savingsTotal) > 0 && <button onClick={() => handleCashOut('savings')} className='mt-2 text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 font-bold'>Cash Out</button>}</div>
                        <div className='bg-white/0 backdrop-blur-[50px] p-4 rounded-[30px] shadow border border-white/50 text-center'><h3 className='text-white text-sm uppercase font-bold'>Insurance</h3><p className='text-2xl font-bold text-white'>₱{data.insuranceTotal}</p>{Number(data.insuranceTotal) > 0 && <button onClick={() => handleCashOut('insurance')} className='mt-2 text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200 font-bold'>Cash Out</button>}</div>
                    </div>

                    <div className='bg-white/0 backdrop-blur-[50px] rounded-[30px] shadow overflow-hidden border border-white/50 p-[15px]'>
                        <div className='p-4 border-b border-white/20 bg-white/0 flex justify-between items-center'>
                             <h3 className='font-bold text-white'>Transaction History</h3>
                             <select className='border bg-white/20 text-white border-white/30 rounded-[20px] text-sm p-3 focus:outline-none focus:border-blue-500 [&>option]:text-black' value={filterType} onChange={(e) => setFilterType(e.target.value)}><option value="all">Show All</option><option value="loan">Loans</option><option value="savings">Savings</option><option value="insurance">Insurance</option></select>
                        </div>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm text-left'><thead className='bg-white/10 text-white '><tr><th className='p-3'>Type</th><th className='p-3'>Amount</th><th className='p-3'>Due</th><th className='p-3'>Status</th><th className='p-3 text-center'>Action</th></tr></thead>
                                <tbody className='divide-y divide-white/20 px-3'>{filteredRecords.map(rec => (<tr key={rec.id} className='hover:bg-white/10 transition'><td className='p-3 capitalize text-white'>{rec.type === 'loan_payment' && rec.loan_name ? <span>Loan Pmt: {rec.loan_name}</span> : rec.type.replace('_', ' ')}</td><td className='p-3 font-medium text-white'>₱{rec.amount}</td><td className='p-3 text-white'>{new Date(rec.due_date).toLocaleDateString()}</td><td className='p-3'><span className={`px-2 py-1 rounded-full text-xs font-bold ${rec.status === 'paid' ? 'bg-green-100 text-green-700' : rec.status === 'late' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{rec.status}</span></td><td className='p-3 flex justify-center items-center gap-2'>{rec.status === 'pending' && <button onClick={() => handleMarkPaid(rec.id)} className='bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs hover:bg-blue-200 font-semibold'>Pay</button>}{(rec.status === 'paid' || rec.status === 'late') && <button onClick={() => handleResetStatus(rec.id)} className='text-white hover:text-gray-300 text-xs underline'>Undo</button>}<button onClick={() => handleCancelTransaction(rec.id)} className='text-red-400 hover:text-red-600 bg-red-100/10 p-1 rounded-full w-6 h-6 flex items-center justify-center font-bold'>✕</button></td></tr>))}</tbody></table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MemberProfile;