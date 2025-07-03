// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.org) All Rights Reserved.

// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at

//    http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied. See the License for the
// specific language governing permissions and limitations
// under the License.


import React, { useEffect, useState } from "react";
import { Tab } from "@headlessui/react";
import { getBooks } from "./api/books/get-books";
import { Book } from "./api/books/types/book";
import groupBy from "lodash/groupBy";
import AddItem from "./components/modal/fragments/add-item";
import { deleteBooks } from "./api/books/delete-books";
import { BasicUserInfo, useAuthContext } from "@asgardeo/auth-react";
import { Dictionary } from "lodash";
import { ArrowPathIcon } from "@heroicons/react/24/solid";

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function App() {
  const [readList, setReadList] = useState<Dictionary<Book[]> | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const {
    signIn,
    signOut,
    getAccessToken,
    isAuthenticated,
    getBasicUserInfo,
    state,
  } = useAuthContext();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<BasicUserInfo | null>(null);

  useEffect(() => {
    async function checkAuthStatus() {
      setIsAuthLoading(true);
      try {
        const isSignedIn = await isAuthenticated();
        if (isSignedIn) {
          await getUser();
          await getReadingList();
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsAuthLoading(false);
      }
    }
    
    checkAuthStatus();
  }, [state.isAuthenticated]); // Watch for authentication state changes

  async function getUser() {
    setIsLoading(true);
    const userResponse = await getBasicUserInfo();
    setUser(userResponse);
    setIsLoading(false);
  }

  async function getReadingList(forceRefresh = false) {
    const isSignedIn = await isAuthenticated();
    if (isSignedIn) {
      setIsLoading(true);
      try {
        console.log('Fetching books...', forceRefresh ? '(forced refresh)' : '');
        
        // Get access token before making API call
        const accessToken = await getAccessToken();
        console.log('Access token obtained:', accessToken ? 'Yes' : 'No');
        
        const res = await getBooks(accessToken);
        console.log('Books response:', res.data);
        
        if (res.data && res.data.length > 0) {
          const grouped = groupBy(res.data, (item) => item.status);
          console.log('Grouped books:', grouped);
          setReadList(grouped);
        } else {
          console.log('No books found');
          setReadList({});
        }
      } catch (e) {
        console.error("Error fetching books:", e);
        if (forceRefresh) {
          alert('Failed to load books. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    // Only refresh when modal closes after being open (indicating a book might have been added)
    let timeoutId: number;
    
    if (!isAddItemOpen && state.isAuthenticated) {
      console.log('Modal closed, refreshing book list...');
      // Add a small delay to ensure the API call from adding the book has completed
      timeoutId = setTimeout(() => {
        getReadingList();
      }, 500);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAddItemOpen, state.isAuthenticated]);

  const handleDelete = async (uuid: string) => {
    if (!uuid) {
      console.error('Cannot delete: UUID is missing');
      alert('Cannot delete book: ID is missing');
      return;
    }
    
    try {
      setDeletingBookId(uuid); // Set specific book as being deleted
      const accessToken = await getAccessToken();
      await deleteBooks(accessToken, uuid);
      console.log('Book deleted successfully');
      // Refresh the list after deletion
      await getReadingList();
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete book. Please try again.');
    } finally {
      setDeletingBookId(null); // Clear the deleting state
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn();
      // After successful sign in, refresh the page state
      window.location.reload();
    } catch (e) {
      console.log("Sign in error:", e);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Clear local state
      setUser(null);
      setReadList(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  // Check authentication status synchronously using the auth context state
  const isSignedIn = state.isAuthenticated;

  if (!isSignedIn) {
    return (
      <button
        className="float-right bg-black bg-opacity-20 p-2 rounded-md text-sm my-3 font-medium text-white"
        onClick={handleSignIn}
      >
        Login
      </button>
    );
  }

  return (
    <div className="header-2 w-screen h-screen overflow-hidden">
      <nav className="bg-white py-2 md:py-2">
        <div className="container px-4 mx-auto md:flex md:items-center">
          <div className="flex justify-between items-center">
            {user && (
              <a href="#" className="font-bold text-xl text-[#36d1dc]">
                {user?.orgName}
              </a>
            )}
            <button
              className="border border-solid border-gray-600 px-3 py-1 rounded text-gray-600 opacity-50 hover:opacity-75 md:hidden"
              id="navbar-toggle"
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>

          <div
            className="hidden md:flex flex-col md:flex-row md:ml-auto mt-3 md:mt-0"
            id="navbar-collapse"
          >
            <button
              className="float-right bg-[#5b86e5] p-2 rounded-md text-sm my-3 font-medium text-white"
              onClick={handleSignOut}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="py-3 md:py-6">
        <div className="container px-4 mx-auto flex justify-center">
          <div className="w-full max-w-lg px-2 py-16 sm:px-0 mb-20">
            <div className="flex justify-between">
              <p className="text-4xl text-white mb-3 font-bold">Reading List</p>
              <div className="container w-auto">
                <button
                  className="float-right bg-black bg-opacity-20 p-2 rounded-md text-sm my-3 font-medium text-white h-10"
                  onClick={() => setIsAddItemOpen(true)}
                >
                  + Add New
                </button>
                <button
                  className={`float-right bg-black bg-opacity-20 p-2 rounded-md text-sm my-3 font-medium text-white w-10 h-10 mr-1 transition-opacity ${isLoading ? 'opacity-50' : 'hover:opacity-80'}`}
                  onClick={() => {
                    console.log('Manual refresh triggered');
                    getReadingList(true); // Force refresh with error alerts
                  }}
                  disabled={isLoading}
                >
                  <ArrowPathIcon className={isLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
            {readList && Object.keys(readList).length > 0 ? (
              <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                  {Object.keys(readList).map((status) => {
                    const count = readList[status]?.length || 0;
                    const displayName = status.replace('_', ' ').toUpperCase();
                    return (
                      <Tab
                        key={status}
                        className={({ selected }) =>
                          classNames(
                            "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                            "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                            selected
                              ? "bg-white shadow text-blue-700"
                              : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                          )
                        }
                      >
                        <div className="flex flex-col items-center">
                          <span>{displayName}</span>
                          <span className="text-xs opacity-75">({count})</span>
                        </div>
                      </Tab>
                    );
                  })}
                </Tab.List>
                <Tab.Panels className="mt-2">
                  {Object.entries(readList).map(([status, books], idx) => (
                    <Tab.Panel
                      key={idx}
                      className={
                        isLoading
                          ? classNames(
                              "rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 animate-pulse"
                            )
                          : classNames(
                              "rounded-xl bg-white p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
                            )
                      }
                    >
                      {books && books.length > 0 ? (
                        <ul className="space-y-2">
                          {(books as Book[]).map((book) => (
                            <li key={book.uuid} className="border-b border-gray-100 pb-2 last:border-b-0">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h3 className="text-sm font-medium leading-5 text-gray-900">
                                    {book.title}
                                  </h3>
                                  <p className="text-xs text-gray-500 mt-1">
                                    by {book.author}
                                  </p>
                                  <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                    {status.replace('_', ' ')}
                                  </span>
                                </div>
                                <button
                                  className="ml-3 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs px-3 py-1 transition-colors disabled:opacity-50"
                                  onClick={() => {
                                    console.log('Delete button clicked, book:', book);
                                    if (book.uuid) {
                                      if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
                                        handleDelete(book.uuid);
                                      }
                                    } else {
                                      console.error('Book UUID is missing:', book);
                                      alert('Cannot delete book: UUID is missing');
                                    }
                                  }}
                                  disabled={deletingBookId === book.uuid}
                                >
                                  {deletingBookId === book.uuid ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No books in "{status.replace('_', ' ')}" category</p>
                          <p className="text-xs mt-1">Add some books to get started!</p>
                        </div>
                      )}
                    </Tab.Panel>
                  ))}
                </Tab.Panels>
              </Tab.Group>
            ) : (
              <div className="rounded-xl bg-white p-8 text-center">
                <div className="text-gray-500">
                  <p className="text-lg mb-2">📚 No books yet!</p>
                  <p className="text-sm">Start building your reading list by adding your first book.</p>
                </div>
              </div>
            )}
            <AddItem 
              isOpen={isAddItemOpen} 
              setIsOpen={setIsAddItemOpen}
              getAccessToken={getAccessToken}
              onBookAdded={() => {
                console.log('Book added callback triggered');
                // Use a timeout to ensure the backend has processed the request
                setTimeout(() => getReadingList(true), 1000);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
