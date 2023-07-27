import { Link, useLocation } from "react-router-dom";

export const ErrorPage = () => {
	const location = useLocation();
	const { code = "404", message = "We can't find that page." } = location.state || {};

	return (
		<div className="bg-white dark:bg-gray-900">
			<div className="flex justify-center items-center my-20 sm:my-24 md:my-32 xl:my-48 text-gray-950 dark:text-white">
				<div className="text-center">
					<h1 className="font-black text-gray-600 text-5xl sm:text-7xl md:text-9xl dark:text-gray-400">{code}</h1>

					<p className="text-2xl md:text-4xl font-bold tracking-tight text-gray-500 dark:text-gray-500">Uh-oh!</p>

					<p className="mt-4">{message}</p>

					<Link to="/" className="inline-block  text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded text-sm px-5 py-2 mt-6 text-center mr-3 md:mr-0 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
						Go Back Home
					</Link>
				</div>
			</div>
		</div>
	);
};
