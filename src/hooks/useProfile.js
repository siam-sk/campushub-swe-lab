import { useEffect, useState } from 'react';
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth } from '../firebase';

// const emptyState = { profile: null, loading: true, error: '' };

export default function useProfile() {
  const role = localStorage.getItem('mockUserRole') || 'student';
  const fullName = role.charAt(0).toUpperCase() + role.slice(1);
  
  return { 
    profile: { 
      uid: `fake_${role}_uid`, 
      email: `${role}@campushub.edu`, 
      fullName: `Mock ${fullName}`, 
      role: role 
    }, 
    loading: false, 
    error: '' 
  };
}

  return state;
}
