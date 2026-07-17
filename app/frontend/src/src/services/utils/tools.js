import {useNavigate} from "react-router-dom";
// Status colors live in services/utils/statusColors.js (single source of
// truth). Re-exported at the bottom for the older callers that import from tools.
import { getStatusColor } from './statusColors';


function getUrlFromCompositeKey(compositeKey, campus) {
    // Parse composite key like "1.2-ins" or "5.14-web"
    const [numbers, suffix] = compositeKey.split('-');
    const [goalNumber, indicatorNumber] = numbers.split('.');

    // Map suffix to working group URL segment
    const workingGroupMap = {
        'web': 'web',
        'pro': 'procurement',
        'ins': 'instructional-materials'
    };

    const workingGroupSegment = workingGroupMap[suffix] || suffix;

    if (campus) {
        return `/${campus}/${workingGroupSegment}/${goalNumber}/${indicatorNumber}`;
    }
    // Return the URL segment
    return `${workingGroupSegment}/${goalNumber}/${indicatorNumber}`;
}


function workingGroupCodeFromName(workingGroupName) {
    const workingGroupMap = {
        'web': 'web',
        'procurement': 'pro',
        'instructional-materials': 'ins'
    }

    return workingGroupMap[workingGroupName] || workingGroupName;
}

function workingGroupWebSafe(workingGroupName) {
    const workingGroupMap = {
        'web': 'web',
        'procurement': 'procurement',
        'instructionalMaterials': 'instructional-materials',

    }

    return workingGroupMap[workingGroupName] || workingGroupName;
}



const year_difference = (current_year) => {
    // Split the year range and convert to numbers
    const [startYear, endYear] = current_year.split('-').map(year => parseInt(year));

    // Subtract 1 from both years
    const newStartYear = startYear - 1;
    const newEndYear = endYear - 1;

    // Return the new year range as a string
    return `${newStartYear}-${newEndYear}`;
};





// The dashboard "working" view URL for a success indicator — the GoalNavigator
// deep-link that pre-selects the indicator via the :indicatorNumber route param:
// /{campus}/dashboard/{workingGroup}/goal/{goalNumber}/{indicatorNumber}. The param
// is consumed by GoalNavigator (initialIndicatorNumber) to land on and highlight the
// specific indicator. (An older #<compositeKey> anchor form was removed — nothing
// read the hash, and it leaked a stale "#1.5-pro" into the URL.) Mirrors the deep
// link EvidenceMasterContainer builds on selection so arrival and in-context
// selection stay in sync.
const getGoalViewUrlFromCompositeKey = (compositeKey, campus) => {
    const [numbers, suffix] = compositeKey.split('-');
    const [goalNumber, indicatorNumber] = numbers.split('.');

    const workingGroupMap = {
        'web': 'web',
        'pro': 'procurement',
        'ins': 'instructional-materials'
    };

    const workingGroupSegment = workingGroupMap[suffix] || suffix;
    const campusPrefix = campus ? `/${campus}` : '';
    return `${campusPrefix}/dashboard/${workingGroupSegment}/goal/${goalNumber}/${indicatorNumber}`;
};


// THE single entry point for "navigate to a success indicator's dashboard goal view
// from its composite key". Consolidates the duplicated edit-URL + split('#') +
// scrollIntoView blocks that were copy-pasted across the implementation, evidence,
// plans, and report views. Pass the caller's react-router `navigate` (works from
// components and the report builder alike). No hash, no manual scroll — the goal view
// selects the indicator from the path param.
const navigateToIndicator = (navigate, compositeKey, campus) => {
    if (!navigate || !compositeKey || !campus) return;
    navigate(getGoalViewUrlFromCompositeKey(compositeKey, campus));
};


const getImplementationURL = (type, uniqueId, campus) => {
    const campusPrefix = campus ? `/${campus}` : '';
    return `${campusPrefix}/ati-explorer/implementations/${type}/${uniqueId}`;
};


// The read-only Report view URL for a success indicator — the dashboard's "View" target:
// /{campus}/dashboard/reports/{workingGroup}/{goal}/{indicator}. This is the canonical
// home for the logic that was inlined in ReportMasterList; ViewReportButton consumes it
// so the Reports table and the Web/IM/Procurement detail panels stay in lockstep.
const getReportUrlFromCompositeKey = (compositeKey, campus) => {
    const [numbers, suffix] = compositeKey.split('-');
    const [goalNumber, indicatorNumber] = numbers.split('.');

    const workingGroupMap = {
        'web': 'web',
        'pro': 'procurement',
        'ins': 'instructional-materials'
    };

    const workingGroupSegment = workingGroupMap[suffix] || suffix;
    const campusPrefix = campus ? `/${campus}` : '';
    return `${campusPrefix}/dashboard/reports/${workingGroupSegment}/${goalNumber}/${indicatorNumber}`;
};


export { getUrlFromCompositeKey,
    getStatusColor,
    year_difference,
    getGoalViewUrlFromCompositeKey,
    navigateToIndicator,
    getImplementationURL,
    getReportUrlFromCompositeKey,
    workingGroupCodeFromName,
    workingGroupWebSafe};
