import './setupAxios'; // must run before any service module touches axios
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import './index.css';
import App from './App';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import AuthGate from './components/AuthGate';
import reportWebVitals from './reportWebVitals';
import {BrowserRouter} from 'react-router-dom';
import {UserProvider} from './context/UserContext';
import {DevSupport} from "@react-buddy/ide-toolbox";
import {ComponentPreviews, useInitial} from "./dev";
import {SettingsProvider} from "./context/SettingsContext";
import {DataProvider} from "./context/DataContext";
import {StatusLevelProvider} from "./context/StatusLevelContext"; // Import UserProvider
import {DescriptorProvider} from "./context/DescriptorContext";
import {MetaScaffoldProvider} from "./context/MetaScaffoldContext";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ChakraProvider theme={theme}>
        <BrowserRouter basename={"/ati"}>
            {/* AuthGate sits above every data-fetching provider so nothing
                requests data until identity is settled (or auth is disabled). */}
            <AuthProvider>
                <AuthGate>
                    <SettingsProvider>
                            <DataProvider>
                                <StatusLevelProvider>
                                    <DescriptorProvider>
                                        <MetaScaffoldProvider>
                                            <UserProvider>  {/* Wrap the app with UserProvider */}

                                                <DevSupport ComponentPreviews={ComponentPreviews}
                                                            useInitialHook={useInitial}
                                                >
                                                    <App/>
                                                </DevSupport>

                                            </UserProvider>
                                        </MetaScaffoldProvider>
                                    </DescriptorProvider>
                                </StatusLevelProvider>
                            </DataProvider>
                    </SettingsProvider>
                </AuthGate>
            </AuthProvider>
        </BrowserRouter>
        </ChakraProvider>
    </React.StrictMode>
);

reportWebVitals();