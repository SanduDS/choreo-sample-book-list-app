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


import { AxiosResponse } from "axios";
import { getReadingListInstance } from "./instance";
import { Book } from "./types/book";

export async function getBooks() {
  const instance = await getReadingListInstance();
  const response = await instance.get("/books");
  
  // Convert object response to array format
  const data = response.data;
  const booksArray = Object.keys(data).map(uuid => ({
    uuid,
    ...data[uuid]
  }));
  
  return { ...response, data: booksArray } as AxiosResponse<Book[]>;
}
