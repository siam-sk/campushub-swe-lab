import { useEffect, useState } from 'react';
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth } from '../firebase';

// const emptyState = { profile: null, loading: true, error: '' };

export default function useProfile() {
  return { 
    profile: { 
      uid: 'fake_admin_uid', 
      email: 'admin@campushub.edu', 
      fullName: 'Mock Admin', 
      role: 'admin' 
    }, 
    loading: false, 
    error: '' 
  };
}

  return state;
}
