import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { Icons } from "./Assets";

export const Navbar = () => {
	const systemMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
	const [darkMode, setDarkMode] = useState(systemMode);

	const toggleDarkMode = () => {
		setDarkMode(!darkMode);
	};

	useEffect(() => {
		if (darkMode) {
			document.body.classList.add("dark", "bg-gray-900");
		} else {
			document.body.classList.remove("dark", "bg-gray-900");
		}
	}, [darkMode]);

	return (
		<nav className="bg-white dark:bg-gray-900">
			<div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
				<Link to="/" className="flex items-center">
					<img src={Icons["mainIcon"]} className="h-10 mr-3" alt="Flowbite Logo" />
					<span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Breath-AI</span>
				</Link>
				<div className="flex md:order-2">
					<button className="ml-2 rounded bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 text-gray-500 transition hover:text-gray-600/75 dark:bg-gray-800 dark:text-gray-400" onClick={toggleDarkMode}>
						{darkMode ? (
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="text-blue-600 w-6 h-6">
								<path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
							</svg>
						) : (
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="text-blue-600 w-6 h-6">
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
							</svg>
						)}
					</button>
				</div>
			</div>
		</nav>
	);
};
