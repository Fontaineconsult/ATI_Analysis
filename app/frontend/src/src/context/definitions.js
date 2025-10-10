// implementationDefinitions.js

const getImplementationDefinitions = () => {
    return {
        // Governance
        Law: {
            name: 'Law',
            description: 'A formal and enforceable rule established by legislative authorities to ensure equal access and non-discrimination for individuals with disabilities. These laws provide the legal framework and mandate for accessibility practices and policies within institutions, such as the Americans with Disabilities Act (ADA) and Section 508 of the Rehabilitation Act.'
        },

        Case: {
            name: 'Case',
            description: 'A legal decision or ruling that interprets or applies laws related to accessibility. Cases provide judicial precedents and clarifications on how laws such as the ADA and Section 508 should be implemented and enforced. These cases can influence policy-making and the development of procedures within institutions to ensure compliance with accessibility standards.'
        },

        Directive: {
            name: 'Directive',
            description: 'An official instruction or order issued by an authority, such as an executive body or regulatory agency, to guide the implementation of accessibility policies and procedures. Directives provide specific guidance on how to achieve compliance with laws and policies, ensuring that institutions follow standardized practices to enhance accessibility and remove barriers for individuals with disabilities.'
        },

        ExternalPolicy: {
            name: 'External Policy',
            description: 'A set of principles and guidelines adopted by an organization to govern decisions and actions related to accessibility. Policies are designed to ensure compliance with relevant laws and directives, providing a framework for making technology, programs, and services accessible to all individuals, including those with disabilities.'
        },

        Memo: {
            name: 'Memo',
            description: 'A written communication, typically used for internal purposes, that provides information, updates, or instructions related to accessibility. Memos can outline changes in policy, highlight important accessibility initiatives, or convey decisions made by leadership regarding the implementation of accessibility practices.'
        },

        Guideline: {
            name: 'Guideline',
            description: 'A set of recommended practices and standards designed to help organizations achieve and maintain accessibility. Guidelines, such as the Web Content Accessibility Guidelines (WCAG), provide detailed criteria for making digital content accessible to individuals with disabilities.'
        },

        // Implementation Types
        Process: {
            name: 'Process',
            description: 'A series of actions or steps taken to achieve a specific goal or outcome related to accessibility. Processes are essential for systematically implementing accessibility policies, plans, and guidelines. These processes ensure continuous quality improvement, prioritize accessibility tasks, and document progress through annual reports.'
        },

        Project: {
            name: 'Project',
            description: 'A temporary and focused effort undertaken to create a specific product, service, or result that enhances accessibility. Projects are designed to implement specific aspects of the ATI, such as the development of new accessible websites, the procurement of accessible technology, or the creation of training programs for staff and faculty.'
        },

        Procedure: {
            name: 'Procedure',
            description: 'A detailed set of instructions or steps that must be followed to perform a specific task or achieve a particular objective related to accessibility. Procedures ensure consistency and compliance with accessibility standards by providing clear guidelines on how to implement policies and processes.'
        },

        Service: {
            name: 'Service',
            description: 'An ongoing support or assistance provided to ensure accessibility for individuals with disabilities. Services are designed to facilitate access to programs, activities, and resources within the institution. Services are integral to implementing ATI policies and goals, ensuring that accessibility is embedded in the daily operations and offerings of the institution.'
        },

        Guidance: {
            name: 'Guidance',
            description: 'Straightforward, practical information designed to help users navigate accessibility resources, understand procedures, or take necessary actions. This category includes tips, instructions, FAQs, and other forms of guidance that provide clear and concise directions to ensure users can effectively access and utilize accessibility-related services and resources.'
        },

        Tracking: {
            name: 'Tracking',
            description: 'A system or method to track the progress of the implementation of the accessibility initiatives, monitoring performance and documenting achievements over time.'
        },

        InternalPolicy: {
            name: 'Internal Policy',
            description: 'A set of rules, procedures, and guidelines developed by an organization to ensure compliance with accessibility standards. Internal policies are tailored to the specific needs and requirements of the institution, providing detailed instructions on how to implement accessibility practices and procedures.'
        },

        Plan: {
            name: 'Plan',
            description: 'A detailed strategy or roadmap outlining the specific steps, resources, and timelines needed to achieve accessibility goals. Plans include the identification of success indicators, allocation of responsibilities, and the scheduling of activities aimed at improving accessibility.'
        },

        Accomplishment: {
            name: 'Accomplishment',
            description: 'A documented achievement that represents progress in the implementation of accessibility initiatives, demonstrating successful completion of specific goals or milestones.'
        },

        // Indicators
        Goal: {
            name: 'Goal',
            description: 'A measurable objective that an organization aims to achieve to enhance accessibility. Goals are set to drive improvements in accessibility practices, ensuring that the organization meets legal and policy requirements.'
        },

        SuccessIndicator: {
            name: 'Success Indicator',
            description: 'A specific metric or benchmark used to measure progress toward achieving a goal. Success indicators provide clear criteria for evaluating the effectiveness of accessibility initiatives and activities.'
        },

        // Evidence
        YearSuccessEvidence: {
            name: 'Year Success Evidence',
            description: 'Documented proof of progress and achievements related to accessibility goals and success indicators for a specific academic year. This evidence includes data and reports on the implementation of accessibility initiatives, the status of success indicators, and any improvements made during the year.'
        },

        StatusLevel: {
            name: 'Status Level',
            description: 'A specific stage or degree of progress made towards achieving accessibility goals and success indicators. Status levels provide a standardized way to evaluate and report the implementation and effectiveness of accessibility initiatives.'
        },

        AcademicYear: {
            name: 'Academic Year',
            description: 'The annual cycle of academic instruction and administrative operations within an institution. It includes specific start and end dates that define the period during which academic activities, such as classes, evaluations, and progress tracking, occur.'
        },

        // Documentation
        Document: {
            name: 'Document',
            description: 'Any written or electronic record that provides information, evidence, or support related to accessibility initiatives. Documents can include policies, guidelines, reports, plans, meeting minutes, instructional materials, and any other relevant files.'
        },

        Webpage: {
            name: 'Webpage',
            description: 'An individual online page that provides information, resources, or support related to accessibility initiatives. Webpages can include sections of the institution\'s website, instructional content, digital services, and other online materials.'
        },

        Note: {
            name: 'Note',
            description: 'An annotation or comment that provides additional information, insights, or clarifications related to various aspects of the ATI. Notes can be used to document observations, feedback, meeting highlights, or important points that support the understanding and implementation of accessibility initiatives.'
        },

        Message: {
            name: 'Message',
            description: 'A communication, such as an email, memo, or announcement, that conveys information related to accessibility initiatives. Messages are used to inform stakeholders about updates, changes, instructions, or decisions regarding the implementation of ATI policies and procedures.'
        },

        Metric: {
            name: 'Metric',
            description: 'A specific quantitative measurement or benchmark used to evaluate the performance, progress, or success of accessibility-related activities. Metrics provide concrete data points that support the evaluation of success indicators and goals.'
        },

        // Committees
        ATIWorkingGroup: {
            name: 'ATI Working Group',
            description: 'A specialized team responsible for overseeing and implementing specific aspects of the ATI within an institution. These working groups focus on key priority areas such as web accessibility, instructional materials, and procurement.'
        },

        // Individuals
        Person: {
            name: 'Person',
            description: 'An individual involved in the implementation and support of accessibility initiatives within the institution. This includes roles such as ATI Executive Sponsors, members of ATI Working Groups, faculty, staff, and students.'
        },

        // Organizational Units
        Department: {
            name: 'Department',
            description: 'An organizational unit within the institution that plays a role in implementing and supporting accessibility initiatives. Departments can include academic units, administrative offices, and support services, each contributing to various aspects of the ATI.'
        },

        College: {
            name: 'College',
            description: 'A major academic division within the institution, typically encompassing multiple departments and programs. Each college is responsible for integrating accessibility into its curricula, research, and administrative practices.'
        },

        Vendor: {
            name: 'Vendor',
            description: 'An external organization or company that provides goods, services, or technology to the institution. Vendors play a crucial role in the procurement of accessible products and services, ensuring that any purchased technology meets the accessibility standards and requirements outlined by the ATI.'
        }
    };
};

// Helper function to get a specific definition
const getDefinition = (typeName) => {
    const definitions = getImplementationDefinitions();
    return definitions[typeName] || null;
};

// Helper function to get only implementation types
const getImplementationTypes = () => {
    const implementationTypeKeys = [
        'Process',
        'Project',
        'Procedure',
        'Service',
        'Guidance',
        'Tracking',
        'InternalPolicy',
        'Plan',
        'Accomplishment'
    ];

    const allDefinitions = getImplementationDefinitions();
    const implementationTypes = {};

    implementationTypeKeys.forEach(key => {
        if (allDefinitions[key]) {
            implementationTypes[key] = allDefinitions[key];
        }
    });

    return implementationTypes;
};

export { getImplementationDefinitions, getDefinition, getImplementationTypes };