import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {BrowserRouter} from 'react-router-dom';
import {UserProvider} from './context/UserContext';
import {DevSupport} from "@react-buddy/ide-toolbox";
import {ComponentPreviews, useInitial} from "./dev";
import {SettingsProvider} from "./context/SettingsContext";
import {DataProvider} from "./context/DataContext";
import {StatusLevelProvider} from "./context/StatusLevelContext"; // Import UserProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter basename={"/ati"}>
            <SettingsProvider>
                    <DataProvider>
                        <StatusLevelProvider>
                            <UserProvider>  {/* Wrap the app with UserProvider */}

                                <DevSupport ComponentPreviews={ComponentPreviews}
                                            useInitialHook={useInitial}
                                >
                                    <App/>
                                </DevSupport>

                            </UserProvider>
                        </StatusLevelProvider>
                    </DataProvider>
            </SettingsProvider>
        </BrowserRouter>
    </React.StrictMode>
);

reportWebVitals();