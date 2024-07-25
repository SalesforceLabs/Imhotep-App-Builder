/*******************************************************************************************
* @Name         ImhotepStringToCollectionInvocable_Test.apxc
* @Author       Mitch Lynch (mitch.lynch@salesforce.com)
* @Date         03/23/2023
* @Description  Test class for ImhotepStringToCollectionInvocable.
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

@isTest
public with sharing class ImhotepStringToCollectionInvocable_Test {
    
    @isTest
    public static void testConvertStringToCollection(){
        
        // create a test string with semi-colon delimited values
        String myTestString = '123456789;987654321;111222333;444555666;777888999;123123123;234234234;345345345;456456456;567567567;678678678;789789789;890890890;901901901';

        // prepare Requests input
        ImhotepStringToCollectionInvocable.Requests testRequestObject = new ImhotepStringToCollectionInvocable.Requests();
        List<ImhotepStringToCollectionInvocable.Requests> testObjectRequestList = new List<ImhotepStringToCollectionInvocable.Requests>();
        testRequestObject.inputString = myTestString;
        testObjectRequestList.add(testRequestObject);

        // Test
        Test.startTest();
        List<ImhotepStringToCollectionInvocable.Results> testObjectResponseList = ImhotepStringToCollectionInvocable.convertStringToCollection(testObjectRequestList);
        Test.stopTest();
        
        // Assertions
        System.assertEquals(14, testObjectResponseList[0].outputStringCollection.size());
        
    }
}