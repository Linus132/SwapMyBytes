import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import {GoogleOAuthProvider} from "@react-oauth/google";
import {UserProvider} from "./contexts/UserContext";
import {createTheme, ThemeProvider} from "@mui/material";

const clientId =
	"682139291069-5950fuvaqq45ij8oeihpoffj1er5aisq.apps.googleusercontent.com";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement
);

const theme = createTheme({
	typography: {
		fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', // System font stack
	},
});
export default theme;

root.render(
	<GoogleOAuthProvider clientId={clientId!}>
		<UserProvider>
			<ThemeProvider theme={theme}>
				<App/>
			</ThemeProvider>
		</UserProvider>
	</GoogleOAuthProvider>
);


