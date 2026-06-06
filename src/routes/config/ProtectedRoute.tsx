// Placeholder for ProtectedRoute
// Will be implemented when auth is needed
export {};

// // interface ProtectedRouteProps {
// //   children: React.ReactNode;
// //   emp_type?: string | string[] | undefined; // Allow both single string and array of strings
// // }

// // const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
// //   children,
// //   emp_type,
// // }) => {
// //   // Access the authentication state from Redux
// //   const { isLoggedIn: isAuthenticated, user } = useAppSelector(
// //     (state) => state.auth
// //   );
  
// //   // Get current location
// //   const location = useLocation();
  
// //   // Check if the user is logged in
// //   if (!user) {
// //     // If the user is not authenticated, redirect to the login page
// //     return <Navigate to="/auth/login" replace />;
// //   }

// //   // Check emp_type access if emp_type is specified
// //   if (emp_type) {
// //     // Get user's employee type
// //     const userEmpType = user?.employee_type || user?.type;
    
// //     // Convert emp_type to array if it's a string
// //     const allowedEmpTypes = Array.isArray(emp_type) 
// //       ? emp_type.map(type => type.toLowerCase())
// //       : [emp_type.toLowerCase()];
    
// //     // Check if user's emp_type is in the allowed types
// //     if (userEmpType && !allowedEmpTypes.includes(userEmpType.toLowerCase())) {
// //       return <NotFound />;
// //     }
// //   }

// //   // If authenticated and has proper access, render children
// //   return <>{children}</>;
// // };

// // export default ProtectedRoute;


// import React from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAppSelector } from '../store/typed-hooks';
// import NotFound from '../pages/Not found/not-found';

// interface ProtectedRouteProps {
//   children: React.ReactNode;
//   emp_type?: string | string[] | undefined; // Allow both single string and array of strings
// }

// const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
//   children,
//   emp_type,
// }) => {
//   // Access the authentication state from Redux
//   const { isLoggedIn: isAuthenticated, user } = useAppSelector(
//     (state) => state.auth
//   );
  
//   // Get current location
//   const location = useLocation();
  
//   // Check if the user is logged in
//   if (!isAuthenticated || !user) {
//     // If the user is not authenticated, redirect to the login page
//     return <Navigate to="/auth/login" replace state={{ from: location }} />;
//   }

//   // Check emp_type access if emp_type is specified
//   if (emp_type) {
//     // Get user's employee type
//     const userEmpType = user?.employee_type || user?.type;
    
//     // Convert emp_type to array if it's a string
//     const allowedEmpTypes = Array.isArray(emp_type) 
//       ? emp_type.map(type => type.toLowerCase())
//       : [emp_type.toLowerCase()];
    
//     // Check if user's emp_type is in the allowed types
//     if (userEmpType) {
//       const userEmpTypeLower = userEmpType.toLowerCase();
      
//       // Special cases for cross-access:
//       // 1. MANAGER can access SUPERVISIOR routes
//       // 2. SUPERVISIOR can access MANAGER routes
//       const hasAccess = allowedEmpTypes.includes(userEmpTypeLower) || 
//                        (userEmpTypeLower === 'manager' && allowedEmpTypes.includes('supervisior')) ||
//                        (userEmpTypeLower === 'supervisior' && allowedEmpTypes.includes('manager'));
      
//       if (!hasAccess) {
//         return <NotFound />;
//       }
//     }
//   }

//   // If authenticated and has proper access, render children
//   return <>{children}</>;
// };

// export default ProtectedRoute;