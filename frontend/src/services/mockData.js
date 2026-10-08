export const MOCK_TICKETS = [
  {
    id: 'T001',
    department: 'Data-Center',
    description:
      'Application server is unavailable after a routine restart. The service did not come back online automatically.',
    score: 100,
    status: 'NEW',
    article: {
      title: 'Restart an unavailable application service',
      content:
        'If an application service is unavailable after a restart, verify the service status and restart the service. Confirm that the service is running normally after the restart.',
      matchingFragments: [
        'service is unavailable',
        'restart the service',
      ],
    },
    questions: [],
  },
  {
    id: 'T002',
    department: 'Laptop Assets',
    description:
      'Laptop is connected to the network but the user cannot access the required internal application.',
    score: 97,
    status: 'NEW',
    article: {
      title: 'Troubleshoot internal application access',
      content:
        'If the laptop is connected to the network but the internal application cannot be accessed, verify network connectivity and confirm that the required application access is available.',
      matchingFragments: [
        'connected to the network',
        'internal application',
      ],
    },
    questions: [],
  },
  {
    id: 'T003',
    department: 'Investment Banking',
    description:
      'The reporting dashboard is showing stale data after the overnight batch completed successfully.',
    score: 87,
    status: 'NEW',
    article: {
      title: 'Refresh stale reporting data',
      content:
        'When a reporting dashboard shows stale data, verify whether the cache is stale and refresh the application cache before checking the dashboard again.',
      matchingFragments: [
        'stale data',
        'cache is stale',
        'refresh the application cache',
      ],
    },
    questions: [
      'When did you first notice the stale data?',
      'Is the stale data visible to all users or only one user?',
      'Did the issue continue after refreshing the dashboard?',
    ],
  },
  {
    id: 'T004',
    department: 'Corporate Banking',
    description:
      'A production application is returning an unexpected error and the available knowledge article does not provide a clear resolution.',
    score: 64,
    status: 'NEW',
    article: {
      title: 'Production application error investigation',
      content:
        'For an unexpected production application error without a clear documented resolution, collect the relevant error details and escalate the issue to Production Support.',
      matchingFragments: [
        'unexpected error',
        'production application',
      ],
    },
    questions: [],
  },
];