import { useContext } from 'react';
import { DescriptorContext } from '../context/DescriptorContext';

// Custom hook to access the shared ontology descriptions store and its handle-lookup helpers.
//
// Example — wire a tooltip to a field description:
//   const { describeField } = useDescriptors();
//   const d = describeField('Interface', 'function');
//   <Tooltip label={d?.description_short}>...</Tooltip>
export const useDescriptors = () => {
    const context = useContext(DescriptorContext);
    if (!context) {
        throw new Error('useDescriptors must be used within a DescriptorProvider');
    }
    return context;
};