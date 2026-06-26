/**
 * API Delete Functions
 * This file contains all DELETE and unassign operations for the API
 */

const API_URL = process.env.REACT_APP_API_URL;

/**
 * Unassign an implementation from a Year Success Evidence
 * @param {string} yearSuccessIdentifier - The YSE identifier (e.g., "2023-2024-1.2-web")
 * @param {string} implementationType - The type of implementation (e.g., "Process", "Tracking", etc.)
 * @param {string} implementationTitle - The title of the implementation to unassign
 * @returns {Promise<Object>} Response object
 */
export const unassignImplementationFromYSE = async (yearSuccessIdentifier, implementationType, implementationTitle) => {
    try {
        const response = await fetch(`${API_URL}/evidence`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'unassign_implementation',
                year_success_identifier: yearSuccessIdentifier,
                implementation_type: implementationType,
                implementation_title: implementationTitle,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to unassign implementation');
        }

        return data;
    } catch (error) {
        console.error('Error unassigning implementation:', error);
        throw error;
    }
};

/**
 * Delete a Plan node
 * @param {string} uniqueId - The unique ID of the plan to delete
 * @returns {Promise<Object>} Response object
 */
export const deletePlan = async (uniqueId) => {
    try {
        const response = await fetch(`${API_URL}/implementations/plans`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                unique_id: uniqueId,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete plan');
        }

        return data;
    } catch (error) {
        console.error('Error deleting plan:', error);
        throw error;
    }
};

/**
 * Delete an Accomplishment node
 * @param {string} uniqueId - The unique ID of the accomplishment to delete
 * @returns {Promise<Object>} Response object
 */
export const deleteAccomplishment = async (uniqueId) => {
    try {
        const response = await fetch(`${API_URL}/implementations/accomplishments`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                unique_id: uniqueId,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete accomplishment');
        }

        return data;
    } catch (error) {
        console.error('Error deleting accomplishment:', error);
        throw error;
    }
};

/**
 * Delete a governance node (Law / Case / Directive / ExternalPolicy / Memo / Guideline).
 * @param {string} governanceType - one of "law" | "case" | "directive" | "external_policy" | "memo" | "guideline"
 * @param {string} uniqueId       - unique_id of the governance node
 */
export const deleteGovernance = async (governanceType, uniqueId) => {
    try {
        const response = await fetch(`${API_URL}/governance`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: governanceType, unique_id: uniqueId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete governance item');
        return data;
    } catch (error) {
        console.error('Error deleting governance item:', error);
        throw error;
    }
};

/**
 * Unassign a person as implementor from a Year Success Evidence
 * @param {string} personUniqueId - The unique ID of the person
 * @param {string} yearSuccessEvidence - The YSE identifier
 * @returns {Promise<Object>} Response object
 */
export const unassignPersonAsImplementor = async (personUniqueId, yearSuccessEvidence) => {
    try {
        const response = await fetch(`${API_URL}/implementations`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'unassign_person_as_implementor',
                unique_id: personUniqueId,
                year_success_evidence: yearSuccessEvidence,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to unassign person');
        }

        return data;
    } catch (error) {
        console.error('Error unassigning person:', error);
        throw error;
    }
};

//
// ASSETS / TAAPs — node deletes (edge unassigns live on PUT, in put.js)
//

export const deleteAsset = async (assetIdentifier) => {
    try {
        const response = await fetch(`${API_URL}/assets`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ asset_identifier: assetIdentifier }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete asset');
        return data;
    } catch (error) {
        console.error('Error deleting asset:', error);
        throw error;
    }
};

export const deleteTaap = async (title) => {
    try {
        const response = await fetch(`${API_URL}/taaps`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete TAAP');
        return data;
    } catch (error) {
        console.error('Error deleting TAAP:', error);
        throw error;
    }
};

export const deleteVendor = async (name) => {
    try {
        const response = await fetch(`${API_URL}/vendors`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete vendor');
        return data;
    } catch (error) {
        console.error('Error deleting vendor:', error);
        throw error;
    }
};

//
// INTERFACES — node delete (edge unassigns live on PUT, in put.js)
//

export const deleteInterface = async (interfaceIdentifier) => {
    try {
        const response = await fetch(`${API_URL}/interfaces`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interface_identifier: interfaceIdentifier }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete interface');
        return data;
    } catch (error) {
        console.error('Error deleting interface:', error);
        throw error;
    }
};

//
// TOOLS — node delete (edge unassigns live on PUT, in put.js)
//

export const deleteTool = async (toolIdentifier) => {
    try {
        const response = await fetch(`${API_URL}/tools`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool_identifier: toolIdentifier }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete tool');
        return data;
    } catch (error) {
        console.error('Error deleting tool:', error);
        throw error;
    }
};

//
// COMPONENTS — node delete (edge unassigns live on PUT, in put.js)
//

export const deleteComponent = async (componentIdentifier) => {
    try {
        const response = await fetch(`${API_URL}/components`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ component_identifier: componentIdentifier }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete component');
        return data;
    } catch (error) {
        console.error('Error deleting component:', error);
        throw error;
    }
};

//
// ONTOLOGY DESCRIPTIONS — node delete (keyed by descriptor_handle)
//

export const deleteDescriptor = async (descriptorHandle) => {
    try {
        const response = await fetch(`${API_URL}/descriptions`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descriptor_handle: descriptorHandle }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete descriptor');
        return data;
    } catch (error) {
        console.error('Error deleting descriptor:', error);
        throw error;
    }
};

//
// META-SCAFFOLD — node deletes (edge attach/detach live on PUT, in put.js)
//

export const deletePrinciple = async (handle) => {
    try {
        const response = await fetch(`${API_URL}/principles`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ handle }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete principle');
        return data;
    } catch (error) {
        console.error('Error deleting principle:', error);
        throw error;
    }
};

// --- Queries (pending questions) ---
export const deleteQuery = async (uniqueId) => {
    try {
        const response = await fetch(`${API_URL}/queries/${uniqueId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.error || 'Failed to delete query');
        }
        return data;
    } catch (error) {
        console.error('Error deleting query:', error);
        throw error;
    }
};