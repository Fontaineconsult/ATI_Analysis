import axios from 'axios';

// Function to fetch primary data from API
export const fetchPrimaryData = async (wg, ay, campus) => {
    const apiUrl = process.env.REACT_APP_API_URL;  // Pull API URL from environment

    try {
        const params = campus ? { campus } : {};
        const response = await axios.get(`${apiUrl}/evidence/${wg}/${ay}`, { params });

        if (response.status === 200) {
            return response.data;  // Return the entire response data
        } else {
            throw new Error(`Failed to fetch data: ${response.data.error}`);
        }
    } catch (error) {
        throw new Error(`Failed to fetch data: ${error.message}`);
    }
};


export const fetchYsesByCampusForYear = async (academicYear) => {
    try {
        const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/evidence/yses-by-campus/${academicYear}`
        );
        if (response.status === 200) {
            return response.data;
        }
        throw new Error(`Failed to fetch YSEs by campus: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching YSEs by campus:', error.message);
        throw error;
    }
};


export const fetchStatusLevels = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/evidence/status-levels`);

        if (response.status === 200) {
            return response.data;  // Return the entire response data
        } else {
            throw new Error(`Failed to fetch status levels: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error fetching status levels:', error.message);
        throw error;
    }
};



export const fetchUserByEmployeeId = async (employeeId) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/individuals?employee_id=${employeeId}`);

        if (response.status === 200) {
            return response.data;  // Return the entire response data
        } else {
            throw new Error(`Failed to fetch user: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error fetching user:', error.message);
        throw error;
    }
};


export const fetchCurrentYearIndicator = async (currentYear) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/indicators/${currentYear}`);

        if (response.status === 200) {
            return response.data;  // Return the entire response data
        } else {
            throw new Error(`Failed to fetch current year indicator: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error fetching current year indicator:', error.message);
        throw error;
    }
};

export const fetchAllIndividuals = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/individuals`);

        if (response.status === 200) {
            return response.data;  // Return the entire response data
        } else {
            throw new Error(`Failed to fetch individuals: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error fetching individuals:', error.message);
        throw error;
    }
}

export const fetchPersonImplementationDetails = async (employeeId) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/individuals`, {
            params: { employee_id: employeeId, details: 'true' },
        });
        if (response.status === 200) {
            return response.data;
        }
        throw new Error(`Failed to fetch person details: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching person details:', error.message);
        throw error;
    }
};

export const fetchTrends = async (previous_year, current_year, campus) => {
    try {
        let url = `${process.env.REACT_APP_API_URL}/evidence/trends?previous_year=${previous_year}&current_year=${current_year}`;
        if (campus) url += `&campus=${campus}`;
        const response = await axios.get(url);

        if (response.status === 200) {
            return response.data;  // Return the entire response data
        } else {
            throw new Error(`Failed to fetch individuals: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error fetching individuals:', error.message);
        throw error;
    }
}

export const fetchImplementation = async (implementation_type, title) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/implementations`, {
            params: {
                implementation_type,
                title
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching implementation:', error);
        throw error;
    }
}

export const fetchImplementationsByType = async (implementation_type) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/implementations`, {
            params: { implementation_type }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching implementations by type:', error);
        throw error;
    }
}

export const fetchAllImplementations = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/implementations`, {
            params: { all: 'true' }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching all implementations:', error);
        throw error;
    }
}

export const fetchSubNodes = async (category) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/evidence/status-levels`, {
            params: { category }
        });
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error(`Failed to fetch sub-nodes: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error fetching sub-nodes:', error.message);
        throw error;
    }
}

export const fetchCampuses = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/organizational-units`, {
            params: { type: 'campuses' }
        });
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error(`Failed to fetch campuses: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error fetching campuses:', error.message);
        throw error;
    }
}

export const fetchAllDocuments = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/documents/documents`);
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch documents: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching documents:', error.message);
        throw error;
    }
};

export const fetchAllWebpages = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/documents/webpages`);
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch webpages: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching webpages:', error.message);
        throw error;
    }
};

export const fetchAllGovernance = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/governance`);
        if (response.status === 200) {
            return response.data;
        }
        throw new Error(`Failed to fetch governance: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching governance:', error.message);
        throw error;
    }
};

export const fetchCampusPlan = async (campusAbbrev, academicYear) => {
    try {
        const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/campus-plans/${campusAbbrev}/${academicYear}`
        );
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error(`Failed to fetch campus plan: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error fetching campus plan:', error.message);
        throw error;
    }
}

//
// ASSETS / TAAPs
//

// Assets ---------------------------------------------------------------------

export const fetchAllAssets = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/assets`);
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch assets: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching assets:', error.message);
        throw error;
    }
};

export const fetchAssetDetail = async (assetIdentifier) => {
    try {
        const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/assets/${encodeURIComponent(assetIdentifier)}`
        );
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch asset: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching asset detail:', error.message);
        throw error;
    }
};

export const fetchAssetsByScope = async (scope) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/assets`, {
            params: { scope },
        });
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch assets by scope: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching assets by scope:', error.message);
        throw error;
    }
};

export const fetchAssetsByCampus = async (campusAbbrev) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/assets`, {
            params: { campus: campusAbbrev },
        });
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch assets by campus: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching assets by campus:', error.message);
        throw error;
    }
};

export const fetchElevationSignalAssets = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/assets`, {
            params: { elevation_signal: true },
        });
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch elevation-signal assets: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching elevation-signal assets:', error.message);
        throw error;
    }
};

// TAAPs ----------------------------------------------------------------------

export const fetchAllTaaps = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/taaps`);
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch TAAPs: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching TAAPs:', error.message);
        throw error;
    }
};

export const fetchTaapDetail = async (title) => {
    try {
        const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/taaps/${encodeURIComponent(title)}`
        );
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch TAAP: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching TAAP detail:', error.message);
        throw error;
    }
};

export const fetchTaapsForAsset = async (assetIdentifier) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/taaps`, {
            params: { asset_identifier: assetIdentifier },
        });
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch TAAPs for asset: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching TAAPs for asset:', error.message);
        throw error;
    }
};

export const fetchActiveTaaps = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/taaps`, {
            params: { active: true },
        });
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch active TAAPs: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching active TAAPs:', error.message);
        throw error;
    }
};

export const fetchTaapsDueForReview = async (dueBefore) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/taaps`, {
            params: { due_before: dueBefore },
        });
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch TAAPs due for review: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching TAAPs due for review:', error.message);
        throw error;
    }
};

// Organizational units used as asset stewards / suppliers --------------------

export const fetchVendors = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/organizational-units`, {
            params: { type: 'vendors' },
        });
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch vendors: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching vendors:', error.message);
        throw error;
    }
};

export const fetchDepartments = async (campus) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/organizational-units`, {
            params: campus ? { type: 'departments', campus } : { type: 'departments' },
        });
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch departments: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching departments:', error.message);
        throw error;
    }
};

export const fetchColleges = async (campus) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/organizational-units`, {
            params: campus ? { type: 'colleges', campus } : { type: 'colleges' },
        });
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch colleges: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching colleges:', error.message);
        throw error;
    }
};

// Vendor CRUD resource (/vendors) — richer than the org-units ?type=vendors
// reference list (this one carries location + detail). fetchVendors above stays
// for the asset supplier dropdowns.
export const fetchVendorsList = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/vendors`);
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch vendors: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching vendors list:', error.message);
        throw error;
    }
};

export const fetchVendorDetail = async (name) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/vendors/${encodeURIComponent(name)}`);
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch vendor: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching vendor detail:', error.message);
        throw error;
    }
};

//
// INTERFACES — the salient interaction points where the accessibility duty lands.
//

export const fetchAllInterfaces = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/interfaces`);
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch interfaces: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching interfaces:', error.message);
        throw error;
    }
};

export const fetchInterfaceDetail = async (interfaceIdentifier) => {
    try {
        const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/interfaces/${encodeURIComponent(interfaceIdentifier)}`
        );
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch interface: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching interface detail:', error.message);
        throw error;
    }
};

export const fetchUncoveredInterfaces = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/interfaces`, {
            params: { uncovered: true },
        });
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch uncovered interfaces: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching uncovered interfaces:', error.message);
        throw error;
    }
};

export const fetchInterfacesByKind = async (kind) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/interfaces`, {
            params: { kind },
        });
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch interfaces by kind: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching interfaces by kind:', error.message);
        throw error;
    }
};

export const fetchInterfacesByAudience = async (audience) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/interfaces`, {
            params: { audience },
        });
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch interfaces by audience: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching interfaces by audience:', error.message);
        throw error;
    }
};

export const fetchInterfacesByCoverageDomain = async (coverageDomain) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/interfaces`, {
            params: { coverage_domain: coverageDomain },
        });
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch interfaces by coverage domain: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching interfaces by coverage domain:', error.message);
        throw error;
    }
};

export const fetchInterfacesForAsset = async (assetIdentifier) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/interfaces`, {
            params: { asset: assetIdentifier },
        });
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch interfaces for asset: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching interfaces for asset:', error.message);
        throw error;
    }
};

//
// SETTINGS — read-only vocabularies from data_config.py (single source of truth).
// The frontend fetches these instead of hardcoding label/key copies.
//

export const fetchSettings = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/settings`);
        if (response.status === 200) return response.data;
        throw new Error(`Failed to fetch settings: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching settings:', error.message);
        throw error;
    }
};
