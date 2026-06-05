import { useContext } from 'react';
import { MetaScaffoldContext } from '../context/MetaScaffoldContext';

// Custom hook to access the shared meta-scaffold store (Principles, IntellectualSources) + its
// handle/id lookup helpers + reload().
//
// Example:
//   const { principles, loading, reload, getPrinciple } = useMetaScaffold();
export const useMetaScaffold = () => {
    const context = useContext(MetaScaffoldContext);
    if (!context) {
        throw new Error('useMetaScaffold must be used within a MetaScaffoldProvider');
    }
    return context;
};
