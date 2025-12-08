import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function MemberProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [records, setRecords] = useState([]);
    
    // Form State for Assigning Records
    const [form, setForm] = useState({
        type: 'loan',
        amount: '',
        due_date: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        if(role !== 'leader') navigate('/dashboard');

        // Fetch Member Profile
        axios.get(`http://localhost:8081/profile/${id}`, { headers: { Authorization: token } })
            .then(res => setMember(res.data.Result))
            .catch(err => console.log(err));

        // Fetch Member's Financial Records
        fetchRecords();
    }, [id]);

    const fetchRecords = () => {
        const token = localStorage.getItem('token');
        axios.get(`http://localhost:8081/my-records/${id}`, { headers: { Authorization: token } })
            .then(res => setRecords(res.data.Result || []))
            .catch(err => console.log(err));
    };

    const handleAssign = (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        axios.post('http://localhost:8081/assign-record', { ...form, user_id: id }, { headers: { Authorization: token } })
            .then(res => {
                if(res.data.Status === "Success") {
                    alert("Record Assigned Successfully");
                    fetchRecords(); // Refresh list
                    setForm({ type: 'loan', amount: '', due_date: '' }); // Reset form
                } else {
                    alert(res.data.Error);
                }
            });
    };

    const handleStatusChange = (recordId, newStatus) => {
        const token = localStorage.getItem('token');
        let endpoint = newStatus === 'paid' ? 'mark-paid' : 'cash-out';
        
        axios.put(`http://localhost:8081/${endpoint}/${recordId}`, {}, { headers: { Authorization: token } })
            .then(res => {
                if(res.data.Status === "Success") fetchRecords();
            });
    };

    const handleDeleteMember = () => {
        const confirmDelete = window.confirm("Are you sure you want to DELETE this member? This cannot be undone.");
        if(confirmDelete) {
            const token = localStorage.getItem('token');
            axios.delete(`http://localhost:8081/delete-member/${id}`, { headers: { Authorization: token } })
                .then(res => {
                    if(res.data.Status === "Success") {
                        alert("Member Deleted");
                        navigate('/dashboard');
                    } else {
                        alert("Error deleting member");
                    }
                });
        }
    };

    if (!member) return <div className='p-10'>Loading...</div>;

    return (
        <div className='min-h-screen bg-gray-50 p-6'>
            <button onClick={() => navigate('/dashboard')} className='mb-4 text-blue-600 hover:underline'>← Back to Dashboard</button>
            
            <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6 flex justify-between items-start'>
                <div className='flex gap-4'>
                    <div className='w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-2 border-blue-100'>
                         {member.profile_picture ? 
                            <img src={`http://localhost:8081/images/${member.profile_picture}`} className='w-full h-full object-cover'/> : 
                            <div className='w-full h-full flex items-center justify-center text-gray-400'>No Img</div>
                        }
                    </div>
                    <div>
                        <h1 className='text-2xl font-bold text-gray-800'>{member.full_name}</h1>
                        <p className='text-gray-600'>{member.phone_number}</p>
                        <p className='text-sm text-gray-500 mt-1'>Birthdate: {member.birthdate ? new Date(member.birthdate).toLocaleDateString() : 'N/A'}</p>
                        <p className='text-sm text-gray-500'>Spouse: {member.spouse_name || 'N/A'}</p>
                    </div>
                </div>
                <button onClick={handleDeleteMember} className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow text-sm'>
                    Delete Member
                </button>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* --- ASSIGNMENT FORM --- */}
                <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit'>
                    <h2 className='text-lg font-bold mb-4 border-b pb-2'>Assign New Record</h2>
                    <form onSubmit={handleAssign} className='space-y-4'>
                        <div>
                            <label className='block text-sm font-semibold text-gray-700'>Type</label>
                            <select className='w-full p-2 border rounded' value={form.type} 
                                onChange={e => setForm({...form, type: e.target.value})}>
                                <option value="loan">Loan</option>
                                <option value="savings">Savings</option>
                                <option value="insurance">Insurance</option>
                            </select>
                        </div>
                        <div>
                            <label className='block text-sm font-semibold text-gray-700'>Amount (₱)</label>
                            <input type="number" className='w-full p-2 border rounded' required value={form.amount}
                                onChange={e => setForm({...form, amount: e.target.value})}/>
                        </div>
                        <div>
                            <label className='block text-sm font-semibold text-gray-700'>Due Date</label>
                            <input type="date" className='w-full p-2 border rounded' required value={form.due_date}
                                onChange={e => setForm({...form, due_date: e.target.value})}/>
                        </div>
                        <button className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold'>
                            Assign
                        </button>
                    </form>
                </div>

                {/* --- RECORDS LIST --- */}
                <div className='lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
                    <h2 className='text-lg font-bold mb-4 border-b pb-2'>Member's Financial Records</h2>
                    <table className='w-full text-left'>
                        <thead className='bg-gray-100 text-xs uppercase text-gray-600'>
                            <tr>
                                <th className='px-4 py-2'>Type</th>
                                <th className='px-4 py-2'>Amount</th>
                                <th className='px-4 py-2'>Due Date</th>
                                <th className='px-4 py-2'>Status</th>
                                <th className='px-4 py-2'>Action</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-100'>
                            {records.map((rec) => (
                                <tr key={rec.id} className='hover:bg-gray-50'>
                                    <td className='px-4 py-3 capitalize font-medium'>{rec.type}</td>
                                    <td className='px-4 py-3'>₱{rec.amount}</td>
                                    <td className='px-4 py-3'>{new Date(rec.due_date).toLocaleDateString()}</td>
                                    <td className={`px-4 py-3 text-sm font-bold ${
                                        rec.status === 'paid' ? 'text-green-600' : 
                                        rec.status === 'cashed_out' ? 'text-gray-400 line-through' : 'text-orange-500'
                                    }`}>
                                        {rec.status.replace('_', ' ')}
                                    </td>
                                    <td className='px-4 py-3'>
                                        {rec.status === 'pending' && (
                                            <button onClick={() => handleStatusChange(rec.id, 'paid')} 
                                                className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200'>
                                                Mark Paid
                                            </button>
                                        )}
                                        {(rec.type === 'savings' || rec.type === 'insurance') && rec.status !== 'cashed_out' && (
                                            <button onClick={() => handleStatusChange(rec.id, 'cashed_out')} 
                                                className='ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200'>
                                                Cash Out
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {records.length === 0 && <tr><td colSpan="5" className='text-center py-4 text-gray-400'>No records found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default MemberProfile;