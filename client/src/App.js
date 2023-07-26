import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import { ErrorPage } from "./pages/error-page";
import { Home } from "./pages/home";
import {New_home} from "./pages/New_home";

import { Navbar } from "./components/Navbar";

function App() {
	return (
		<div>
			<Router>
				<Navbar />
				<Routes>
					<Route path="/" element={<New_home />} />
					<Route path="*" element={<ErrorPage code="404" message="We can't find that page." />} />
				</Routes>
			</Router>
		</div>
	);
}

export default App;
