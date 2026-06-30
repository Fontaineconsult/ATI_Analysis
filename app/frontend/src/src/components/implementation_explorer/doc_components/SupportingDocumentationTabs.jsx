import React from 'react';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import DocumentsViewer from './DocumentsViewer';
import WebpagesViewer from './WebpagesViewer';
import NotesViewer from './NotesViewer';
import MessagesViewer from './MessagesViewer';
import MetricsViewer from './MetricsSection';

const defaultFormatDate = (d) => (d ? new Date(d).toLocaleDateString() : null);

/**
 * The one canonical "Supporting Documentation" surface: tabbed Documents /
 * Webpages / Notes / Messages / Metrics over a single implementation (or any
 * is_documented_by host). Used by both ImplementationDetailPanel and the YSE
 * evidence modal so the five viewers — and their managed-file upload/download —
 * live in exactly one place. Data is FLAT (`doc.name`, `doc.file.download_url`).
 *
 * Props:
 *   documents/webpages/notes/messages/metrics  FLAT arrays (default []).
 *   implementation_id / implementation_type     enable add/edit/unlink when both set.
 *   formatDate                                   optional date formatter.
 */
export default function SupportingDocumentationTabs({
    documents = [], webpages = [], notes = [], messages = [], metrics = [],
    implementation_id, implementation_type, formatDate = defaultFormatDate,
}) {
    return (
        <Tabs colorScheme="teal" size="sm" variant="line" isLazy>
            <TabList flexWrap="wrap">
                <Tab fontSize="sm">Documents ({documents.length})</Tab>
                <Tab fontSize="sm">Webpages ({webpages.length})</Tab>
                <Tab fontSize="sm">Notes ({notes.length})</Tab>
                <Tab fontSize="sm">Messages ({messages.length})</Tab>
                <Tab fontSize="sm">Metrics ({metrics.length})</Tab>
            </TabList>
            <TabPanels>
                <TabPanel px={0} pt={4}>
                    <DocumentsViewer
                        documents={documents}
                        implementation_id={implementation_id}
                        implementation_type={implementation_type}
                        formatDate={formatDate}
                    />
                </TabPanel>
                <TabPanel px={0} pt={4}>
                    <WebpagesViewer
                        webpages={webpages}
                        implementation_id={implementation_id}
                        implementation_type={implementation_type}
                        formatDate={formatDate}
                    />
                </TabPanel>
                <TabPanel px={0} pt={4}>
                    <NotesViewer
                        notes={notes}
                        implementation_id={implementation_id}
                        implementation_type={implementation_type}
                        formatDate={formatDate}
                    />
                </TabPanel>
                <TabPanel px={0} pt={4}>
                    <MessagesViewer
                        messages={messages}
                        implementation_id={implementation_id}
                        implementation_type={implementation_type}
                        formatDate={formatDate}
                    />
                </TabPanel>
                <TabPanel px={0} pt={4}>
                    <MetricsViewer
                        metrics={metrics}
                        implementation_id={implementation_id}
                        implementation_type={implementation_type}
                    />
                </TabPanel>
            </TabPanels>
        </Tabs>
    );
}
