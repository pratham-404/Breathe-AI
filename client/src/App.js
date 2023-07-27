import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import { ErrorPage } from "./pages/error-page";
import { Home } from "./pages/home";

import { Navbar } from "./components/Navbar";

function App() {
	return (
		<div>
			<Router>
				<Navbar />
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="*" element={<ErrorPage code="404" message="We can't find that page." />} />
				</Routes>
			</Router>
		</div>
	);
}

export default App;
