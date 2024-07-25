/*******************************************************************************************
* @Name         ImhotepStringToCollectionInvocable.apxc
* @Author       Mitch Lynch (mitch.lynch@salesforce.com)
* @Date         03/03/2023
* @Description  Takes a delimited string of values and returns it as a collection to the flow.
*******************************************************************************************/
/* COPYRIGHT AND LICENSE
* Copyright (c) 2023, Salesforce, Inc.
* SPDX-License-Identifier: Apache-2
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*******************************************************************************************/
/* MODIFICATION LOG
* 	Date		Developer		Story		Description
*   05/25/2024  Mitch Lynch     S000510     Reworked the class to work in the new org.
*
*   LEGACY ORG PACKAGE CHANGES:
*	03/03/2023	Mitch Lynch		S-000187	Initial creation.
*******************************************************************************************/

public without sharing class ImhotepStringToCollectionInvocable {
    
    @InvocableMethod(label='Convert String to Collection' description='Cycles through stories to reorder them when there are conflicts.')
    public static List <Results> convertStringToCollection(List<Requests> inputvars) {
        
        // create a local var for inputString
        String myString = inputvars[0].inputString;

        // create a new string list
        List<String> myList = new List<String>();

        // only take action when the string is not null
        if(myString != null) {
            myList = myString.split(';');
        }

        // Create a Results object to hold the return values
        Results response = new Results();
        
        // Add the return values to the Results object
        response.outputStringCollection = myList;
        
        // Wrap the Results object in a List container 
        // (an extra step added to allow this interface to also support bulkification)
        List<Results> responseWrapper = new List<Results>();
        responseWrapper.add(response);
        return responseWrapper;
        
    }
    
    public class Requests {
        @InvocableVariable(label='inputString' required=true)
        public String inputString;
    }
    
    public class Results {
        @InvocableVariable(label='outputStringCollection' required=true)
        public List<String> outputStringCollection;
    }
    
}