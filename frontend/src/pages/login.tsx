import { useState } from "react";
import login from "../assets/login.jpg";
const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isRobot, setIsRobot] = useState(false);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    console.log("Login attempt with:", { email, password });

    try {
      // Simulated login logic
      if (email && password) {
        alert("Login Successful!");
      } else {
        alert("Please enter both email and password");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong. Please try again!");
    }
  };

  return (
    <div className="w-screen h-screen relative">
      <div
        className="w-full h-full bg-cover bg-center"
        style={{ backgroundImage: `url(${login})` }}
      >
        {/* Main content */}
        <div className="relative w-full min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
            {/* Logo and branding */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-600 mb-2">
                <span className="text-blue-400">Falcon</span> Academic Portal
              </h1>
            </div>

            {/* Login card */}
            <div className="bg-white/10 backdrop-blur-xl border border-gray-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-600 mb-2">
                  Sign In
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Access your academic dashboard
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Email field */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-8 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white/20 border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                      placeholder="Email i.e xyz@abc.com"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-8 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white/20 border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                      placeholder="Password"
                    />
                  </div>
                </div>

                {/* reCAPTCHA placeholder */}
                <div className="flex items-center space-x-2">
                  <div
                    onClick={() => setIsRobot(!isRobot)}
                    className={`w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-500 rounded cursor-pointer flex items-center justify-center transition-colors ${
                      isRobot ? "bg-blue-600 border-blue-600" : "bg-white/10"
                    }`}
                  >
                    {isRobot && (
                      <svg
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <label
                    className="text-xs sm:text-sm text-slate-600 cursor-pointer"
                    onClick={() => setIsRobot(!isRobot)}
                  >
                    I'm not a robot
                  </label>
                </div>

                {/* Remember me and Forgot password */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center">
                    <div
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-500 rounded cursor-pointer flex items-center justify-center transition-colors ${
                        rememberMe
                          ? "bg-blue-600 border-blue-600"
                          : "bg-white/10"
                      }`}
                    >
                      {rememberMe && (
                        <svg
                          className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <label
                      className="ml-2 text-xs sm:text-sm text-slate-600 cursor-pointer"
                      onClick={() => setRememberMe(!rememberMe)}
                    >
                      Remember me
                    </label>
                  </div>
                  <button className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 text-left sm:text-right">
                    Forgot Password?
                  </button>
                </div>

                {/* Sign in button */}
                <button
                  onClick={handleSubmit}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    <span className="text-sm sm:text-base">Sign In</span>
                  </div>
                </button>
              </div>

              {/* Contact info */}
              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  For Password related queries contact concerned Academic
                  Officer on{" "}
                  <button className="text-blue-400 hover:text-blue-300 underline break-all">
                    FalconHouseSchool@gmail.com
                  </button>
                </p>
              </div>
            </div>

            {/* Bottom text */}
            <div className="text-center mt-6 sm:mt-8">
              <p className="text-slate-700 text-xs sm:text-sm md:text-base lg:text-sm xl:text-sm">
                © 2025 Falcon Academic Portal. All rights reserved.
              </p>
            </div>
          </div>
        </div>

        {/* Floating elements for visual appeal - hidden on mobile for better performance */}
        <div className="hidden sm:block absolute top-20 left-20 w-24 h-24 sm:w-32 sm:h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
        <div
          className="hidden sm:block absolute bottom-20 right-20 w-32 h-32 sm:w-40 sm:h-40 bg-purple-500/10 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="hidden lg:block absolute top-1/2 left-10 w-20 h-20 sm:w-24 sm:h-24 bg-green-500/10 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>
    </div>
  );
};

export default LoginForm;
