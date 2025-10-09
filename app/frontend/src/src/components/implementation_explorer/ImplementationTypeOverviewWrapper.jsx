// ImplementationTypeOverviewWrapper.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import ImplementationTypeOverview from './ImplementationTypeOverview';

function ImplementationTypeOverviewWrapper() {
    const { implementationType, implementationId } = useParams();

    return (
        <ImplementationTypeOverview
            implementationType={implementationType}
            initialImplementationId={implementationId}
        />
    );
}

export default ImplementationTypeOverviewWrapper;