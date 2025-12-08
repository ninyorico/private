import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AddMember() {
    const [values, setValues] = useState({
        full_name: '',
        phone_number: '',
        password: '',
        birthdate: '',
        spouse_name: ''
    });
    const [file, setFile] = useState(null); // State for the image file
    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();
        const token = localStorage.getItem('token');
        
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('full_name', values.full_name);
        formData.append('phone_number', values.phone_number);
        formData.append('password', values.password);
        formData.append('birthdate', values.birthdate);
        formData.append('spouse_name', values.spouse_name);
        if(file) {
            formData.append('image', file);
        }

        axios.post('http://localhost:8081/add-member', formData, {
            headers: { Authorization: token }
        })
        .then(res => {
            if(res.data.Status === "Success") {
                alert("Member Added Successfully");
                navigate('/dashboard');
            } else {
                alert("Error: " + res.data.Error);
            }
        })
        .catch(err => console.log(err));
    }

    return (
        <div className='flex justify-center items-center min-h-screen bg-slate-100 p-4'>
            <div className='bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-slate-200'>
                <div className='flex justify-between items-center mb-6'>
                    <h2 className='text-2xl font-bold text-slate-800'>Add New Member</h2>
                    <button onClick={() => navigate('/dashboard')} className='text-gray-400 hover:text-gray-600'>✕</button>
                </div>
                
                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                        <label className='block text-sm font-semibold text-gray-700'>Full Name</label>
                        <input type="text" className='w-full p-2 border rounded' required
                            onChange={e => setValues({...values, full_name: e.target.value})}/>
                    </div>
                    <div>
                        <label className='block text-sm font-semibold text-gray-700'>Profile Picture</label>
                        <input type="file" className='w-full p-2 border rounded'
                            onChange={e => setFile(e.target.files[0])}/>
                    </div>
                    <div className='flex gap-2'>
                        <div className='w-1/2'>
                            <label className='block text-sm font-semibold text-gray-700'>Birthdate</label>
                            <input type="date" className='w-full p-2 border rounded' required
                                onChange={e => setValues({...values, birthdate: e.target.value})}/>
                        </div>
                        <div className='w-1/2'>
                            <label className='block text-sm font-semibold text-gray-700'>Spouse Name</label>
                            <input type="text" className='w-full p-2 border rounded' placeholder='Optional'
                                onChange={e => setValues({...values, spouse_name: e.target.value})}/>
                        </div>
                    </div>
                    <div>
                        <label className='block text-sm font-semibold text-gray-700'>Phone (Login ID)</label>
                        <input type="text" className='w-full p-2 border rounded' required
                            onChange={e => setValues({...values, phone_number: e.target.value})}/>
                    </div>
                    <div>
                        <label className='block text-sm font-semibold text-gray-700'>Password</label>
                        <input type="password" className='w-full p-2 border rounded' required
                            onChange={e => setValues({...values, password: e.target.value})}/>
                    </div>
                    
                    <button type="submit" className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded shadow'>
                        Register Member
                    </button>
                </form>
            </div>
        </div>
    )
}

export default AddMember;