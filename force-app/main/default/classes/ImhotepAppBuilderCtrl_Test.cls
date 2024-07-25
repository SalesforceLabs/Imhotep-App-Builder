/*******************************************************************************************
* @Name         ImhotepAppBuilderCtrl_Test.apxc
* @Author       Mitch Lynch (mitch.lynch@salesforce.com)
* @Date         09/25/2022
* @Description  Test class for ImhotepAppBuilderCtrl.
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
* 	Date		Developer			Story		Description
*   07/24/2024  Mitch Lynch         S000093     Added tests for getReleaseChanges().
*   07/23/2024  Mitch Lynch         S000369     Added tests for getMetadataComponents() and getMetadataTypes().
*   06/04/2024  Mitch Lynch         S000037     Modified saveReorderedStories() input from String to Map<Id,Decimal> to protect against SOQL injection.
*   05/24/2024  Mitch Lynch         S000486     Reworked the class to work in the new org.
*
*   LEGACY ORG PACKAGE CHANGES:
*   08/21/2023  Mitch Lynch         S-000102    Added tests for getStoriesByRelease() and saveReorderedStories() methods.
*   07/01/2023  Mitch Lynch         S-000329    Added tests for getProjectId(), which was based on getProjectResources().
*   06/30/2023  Mitch Lynch         S-000336    Added tests for getProjectResources(), getTestCasesWithTestResults(). Added new test coverage in testGetAllReleases() and testTagAssignmentRecords().
*   03/07/2023  Mitch Lynch         S-000298    Added tests for getImhotepActiveMetadata().
*   03/07/2023  Mitch Lynch         S-000188    Added tests for getTemplateItemsForType().
*   03/04/2023  Mitch Lynch         S-000188    Added Template test data and tests for getTemplatesByType().
*   02/28/2023  Mitch Lynch         S-000183    Continued writing test coverage for missing methods: testGetProjectsByMembership(), testGetProjectMembers(), testGetAllReleases(), and testGetReleaseLists().
*   02/27/2023  Mitch Lynch         S-000183    Continued writing test coverage for missing methods: makeData(), testGetActiveProjectTagRecords(), testGetStoryTagAssignmentRecords(), testGetTagAssignmentRecords(), and testCheckUserEditAccess().
*   02/25/2023  Mitch Lynch         S-000183    Renamed from ImhotepReleaseKanbanCtrl_Test to ImhotepAppBuilderCtrl_Test to consolidate code and reduce test code.
*   02/24/2023  Mitch Lynch         S-000180    Renamed from devReleaseKanbanCtrl_Test to ImhotepReleaseKanbanCtrl_Test.
*   02/21/2023  Mitch Lynch         S-000166    Updated to use namespace "imhotep".
*   10/24/2022  Mitch Lynch         S-000101    Added moveStory() to test moveStory() method.
*   10/24/2022  Mitch Lynch         S-000101    Added testGetStoriesByStatus() to test getStatoriesByStatus() method.
*	10/20/2022	Mitch Lynch			S-000092	Updated to replace the "In Progress" status with "Building" in the test data, replace the "Ready to Deploy" status with "Ready" in the test data, add records for the new "Testing" status, and remove records for the retired "Accepted" status, to reflect picklist value changes in the Story__c.Status__c field.
*	09/25/2022	Mitch Lynch			000064		Initial creation.
*******************************************************************************************/
/* NOTES
* 
*******************************************************************************************/

@isTest
public with sharing class ImhotepAppBuilderCtrl_Test {

    

    @TestSetup
    public static void makeData(){
        
        
        
        // *************************
        // USERS
        // *************************

        User user01 = [SELECT Id,FirstName,LastName FROM User WHERE Id = :UserInfo.getUserId()];


        
        // *************************
        // PROJECTS
        // *************************

        // create project list
        List<iab__Project__c> pList = new List<iab__Project__c>();

        // create projects for user01
        iab__Project__c project01 = new iab__Project__c(
            Name                = 'Project 1 - Planning',
            OwnerId             = user01.Id,
            iab__Status__c      = 'Planning'
        );
        pList.add(project01);

        iab__Project__c project02 = new iab__Project__c(
            Name                = 'Project 2 - Active',
            OwnerId             = user01.Id,
            iab__Status__c      = 'Active'
        );
        pList.add(project02);

        iab__Project__c project03 = new iab__Project__c(
            Name                = 'Project 3 - Active',
            OwnerId             = user01.Id,
            iab__Status__c      = 'Active'
        );
        pList.add(project03);

        iab__Project__c project04 = new iab__Project__c(
            Name                = 'Project 4 - Active',
            OwnerId             = user01.Id,
            iab__Status__c      = 'Active'
        );
        pList.add(project04);

        iab__Project__c project05 = new iab__Project__c(
            Name                = 'Project 5 - Completed',
            OwnerId             = user01.Id,
            iab__Status__c      = 'Completed'
        );
        pList.add(project05);

        insert pList;



        // *************************
        // PROJECT MEMBERS FOR ALL PROJECTS
        // *************************

        // create a project members list
        List<iab__Project_Member__c> pmList = new List<iab__Project_Member__c>();

        // project01

            // user01 - owner/lead
            iab__Project_Member__c pm01 = new iab__Project_Member__c(
                iab__Project__c     = project01.Id,
                iab__Role__c        = 'Owner/Lead',
                iab__User__c        = user01.Id,
                Name                = user01.FirstName + ' ' + user01.LastName,
                OwnerId             = user01.Id
            );
            pmList.add(pm01);

        // project02

            // user01 - owner/lead
            iab__Project_Member__c pm02 = new iab__Project_Member__c(
                iab__Project__c     = project02.Id,
                iab__Role__c        = 'Owner/Lead',
                iab__User__c        = user01.Id,
                Name                = user01.FirstName + ' ' + user01.LastName,
                OwnerId             = user01.Id
            );
            pmList.add(pm02);

        // project03

            // user01 - owner/lead
            iab__Project_Member__c pm04 = new iab__Project_Member__c(
                iab__Project__c     = project03.Id,
                iab__Role__c        = 'Owner/Lead',
                iab__User__c        = user01.Id,
                Name                = user01.FirstName + ' ' + user01.LastName,
                OwnerId             = user01.Id
            );
            pmList.add(pm04);

        // project04

            // user01 - owner/lead
            iab__Project_Member__c pm05 = new iab__Project_Member__c(
                iab__Project__c     = project04.Id,
                iab__Role__c        = 'Owner/Lead',
                iab__User__c        = user01.Id,
                Name                = user01.FirstName + ' ' + user01.LastName,
                OwnerId             = user01.Id
            );
            pmList.add(pm05);

        // project05

            // user01 - owner/lead
            iab__Project_Member__c pm06 = new iab__Project_Member__c(
                iab__Project__c     = project05.Id,
                iab__Role__c        = 'Owner/Lead',
                iab__User__c        = user01.Id,
                Name                = user01.FirstName + ' ' + user01.LastName,
                OwnerId             = user01.Id
            );
            pmList.add(pm06);

        insert pmList;
        
        

        // *************************
        // RESOURCE LINKS (was Project Resources)
        // *************************
        
        // create resource link list
        List<iab__Resource_Link__c> resourceList = new List<iab__Resource_Link__c>();

        // create project resources for project02
        iab__Resource_Link__c resource01 = new iab__Resource_Link__c(
            iab__Project__c     = project02.Id,
            Name                = 'Salesforce Web Site',
            iab__Type__c        = 'URL',
            iab__URL__c         = 'http://www.salesforce.com'
        );
        resourceList.add(resource01);

        iab__Resource_Link__c resource02 = new iab__Resource_Link__c(
            iab__Project__c     = project02.Id,
            Name                = 'Trailhead',
            iab__Type__c        = 'URL',
            iab__URL__c         = 'http://trailhead.salesforce.com'
        );
        resourceList.add(resource02);

        iab__Resource_Link__c resource03 = new iab__Resource_Link__c(
            iab__Project__c     = project02.Id,
            Name                = 'This Old Cloud',
            iab__Type__c        = 'URL',
            iab__URL__c         = 'http://www.thisoldcloud.app'
        );
        resourceList.add(resource03);

        insert resourceList;

        

        // *************************
        // RELEASES
        // *************************
        
        // create release list
        List<iab__Release__c> rList = new List<iab__Release__c>();
        

        // create releases for project #2
        iab__Release__c release01 = new iab__Release__c(Name='MVP',iab__Status__c='Active',iab__Project__c=project02.Id);
        rList.add(release01);
        
        iab__Release__c release02 = new iab__Release__c(Name='MVP Backlog',iab__Status__c='Planning',iab__Project__c=project02.Id,iab__Is_Backlog__c=true);
        rList.add(release02);
        

        // create releases for project #4
        iab__Release__c release03 = new iab__Release__c(Name='Release 1.0',iab__Status__c='Accepted',iab__Project__c=project04.Id);
        rList.add(release03);

        iab__Release__c release04 = new iab__Release__c(Name='Release 2.0',iab__Status__c='Active',iab__Project__c=project04.Id);
        rList.add(release04);
        
        iab__Release__c release05 = new iab__Release__c(Name='Backlog',iab__Status__c='Planning',iab__Project__c=project04.Id,iab__Is_Backlog__c=true);
        rList.add(release05);

        iab__Release__c release06 = new iab__Release__c(Name='Release 3.0',iab__Status__c='Planning',iab__Project__c=project04.Id,iab__Is_Backlog__c=false);
        rList.add(release06);


        // create releases
        insert rList;

        
        
        // *************************
        // STORIES FOR RELEASE #1 (MVP), PROJECT #2
        // *************************
        
        // create 22 stories

        // create story list and counter to use for all story creation
        List<iab__Story__c> sList = new List<iab__Story__c>();
        Integer storyCount = 1;
        
        // create 1 story ==> release01, Blocked
        iab__Story__c story01rel01      = new iab__Story__c(
            iab__Project__c             = project02.Id,
            iab__Release__c			    = release01.Id,
            Name                        = 'New Blocked Story',
            iab__Priority_Order__c	    = storyCount,
            iab__Status__c			    = 'Blocked'
        );
        sList.add(story01rel01);
        storyCount = storyCount + 1;
        
        // create 2 stories ==> release01, Defined
        for (Integer i = 0; i < 2; i++) {
            iab__Story__c story02rel01  = new iab__Story__c(
                iab__Project__c         = project02.Id,
                iab__Release__c			= release01.Id,
                Name                    = 'New Defined Story',
                iab__Priority_Order__c	= storyCount,
                iab__Status__c			= 'Defined'
            );
            sList.add(story02rel01);
            storyCount = storyCount + 1;
        }
        
        // create 3 stories ==> release01, Building
        for (Integer i = 0; i < 3; i++) {
            iab__Story__c story03rel01  = new iab__Story__c(
                iab__Project__c         = project02.Id,
                iab__Release__c			= release01.Id,
                Name                    = 'New Building Story',
                iab__Priority_Order__c	= storyCount,
                iab__Status__c			= 'Building'
            );
            sList.add(story03rel01);
            storyCount = storyCount + 1;
        }
        
        // create 4 stories ==> release01, Testing
        for (Integer i = 0; i < 4; i++) {
            iab__Story__c story04rel01  = new iab__Story__c(
                iab__Project__c         = project02.Id,
                iab__Release__c			= release01.Id,
                Name                    = 'New Testing Story',
                iab__Priority_Order__c	= storyCount,
                iab__Status__c			= 'Testing'
            );
            sList.add(story04rel01);
            storyCount = storyCount + 1;
        }

        // create 1 special story ==> release01, Testing (used for Test Scenario and Test Result tests)
        iab__Story__c storyForTestScenarioTesting = new iab__Story__c(
            iab__Project__c             = project02.Id,
            iab__Release__c			    = release01.Id,
            Name                        = 'Story for Test Scenario Testing',
            iab__Status__c			    = 'Testing'
        );
        sList.add(storyForTestScenarioTesting);
        
        // create 5 stories ==> release01, Ready
        for (Integer i = 0; i < 5; i++) {
            iab__Story__c story05rel01  = new iab__Story__c(
                iab__Project__c         = project02.Id,
                iab__Release__c			= release01.Id,
                Name                    = 'New Ready Story',
                iab__Priority_Order__c	= storyCount,
                iab__Status__c			= 'Ready'
            );
            sList.add(story05rel01);
            storyCount = storyCount + 1;
        }
        
        // create 6 stories ==> release01, Deployed
        for (Integer i = 0; i < 6; i++) {
            iab__Story__c story06rel01  = new iab__Story__c(
                iab__Project__c         = project02.Id,
                iab__Release__c			= release01.Id,
                Name                    = 'New Deployed Story',
                iab__Priority_Order__c	= storyCount,
                iab__Status__c			= 'Deployed'
            );
            sList.add(story06rel01);
            storyCount = storyCount + 1;
        }
        
        

        // *************************
        // STORIES FOR RELEASE #2 (MVP BACKLOG), PROJECT #2
        // *************************

        // create 6 stories
        
        // create 0 stories ==> release01, Blocked (it's a backlog)
        
        // create 6 stories ==> release02, Defined
        storyCount = 1;
        for (Integer i = 0; i < 6; i++) {
            iab__Story__c story01rel02 = new iab__Story__c(
                iab__Project__c         = project02.Id,
                iab__Release__c			= release02.Id,
                Name                    = 'New Defined Story',
                iab__Priority_Order__c	= storyCount,
                iab__Status__c			= 'Defined'
            );
            sList.add(story01rel02);
            storyCount = storyCount + 1;
        }
        
        // create 0 stories ==> release01, Building (it's a backlog)
        
        // create 0 stories ==> release01, Testing (it's a backlog)
        
        // create 0 stories ==> release01, Ready (it's a backlog)
        
        // create 0 stories ==> release01, Deployed (it's a backlog)
        
        // create all stories from both releases
        insert sList;
        
        

        // *************************
        // TAGS
        // *************************
        
        // create tag list
        List<iab__Tag__c> tList = new List<iab__Tag__c>();

        // create tags for project02
        iab__Tag__c tag01 = new iab__Tag__c(
            iab__Is_Active__c   = true,
            Name                = 'Test Tag 01',
            iab__Project__c     = project02.Id
        );
        tList.add(tag01);

        iab__Tag__c tag02 = new iab__Tag__c(
            iab__Is_Active__c   = true,
            Name                = 'Test Tag 02',
            iab__Project__c     = project02.Id
        );
        tList.add(tag02);

        iab__Tag__c tag03 = new iab__Tag__c(
            iab__Is_Active__c   = true,
            Name                = 'Test Tag 03',
            iab__Project__c     = project02.Id
        );
        tList.add(tag03);

        insert tList;
        
        

        // *************************
        // TAG ASSIGNMENTS
        // *************************
        
        // create tag assignment list
        List<iab__Tag_Assignment__c> taList = new List<iab__Tag_Assignment__c>();

        // create tag assignments for story
        iab__Tag_Assignment__c ta01     = new iab__Tag_Assignment__c(
            iab__Story__c               = story01rel01.Id,
            iab__Tag__c                 = tag01.Id
        );
        taList.add(ta01);

        // create tag assignments for story
        iab__Tag_Assignment__c ta02     = new iab__Tag_Assignment__c(
            iab__Story__c               = story01rel01.Id,
            iab__Tag__c                 = tag02.Id
        );
        taList.add(ta02);

        insert taList;



        // *************************
        // TEMPLATES
        // *************************
        
        // create template list
        List<iab__Template__c> temList = new List<iab__Template__c>();

        // create template #1 - standard
        iab__Template__c tem01 = new iab__Template__c(
            Name                        = 'Standard Template 01',
            iab__Access__c              = 'Public',
            iab__Standard_Template__c   = true
        );
        temList.add(tem01);

        // create template #2 - standard
        iab__Template__c tem02 = new iab__Template__c(
            Name                        = 'Standard Template 02',
            iab__Access__c              = 'Public',
            iab__Standard_Template__c   = true
        );
        temList.add(tem02);

        // create template #3 - mine #1 (private)
        iab__Template__c tem03 = new iab__Template__c(
            Name                        = 'My Template 03 (Private)',
            iab__Access__c              = 'Private',
            iab__Standard_Template__c   = false
        );
        temList.add(tem03);

        // create template #4 - mine #2 (public)
        iab__Template__c tem04 = new iab__Template__c(
            Name                        = 'My Template 04 (Public)',
            iab__Access__c              = 'Public',
            iab__Standard_Template__c   = false
        );
        temList.add(tem04);

        insert temList;



        // *************************
        // TEMPLATE ITEMS
        // *************************
        
        // create template list
        List<iab__Template_Item__c> tiList = new List<iab__Template_Item__c>();

        Integer itemCount = 1;
        
        // create 3 items ==> tem01
        for (Integer i = 0; i < 3; i++) {
            iab__Template_Item__c item01 = new iab__Template_Item__c(
                Name                        = 'New Defined Story ' + itemCount,
                iab__Template__c            = tem01.Id,
                iab__Priority_Order__c	    = itemCount
            );
            tiList.add(item01);
            itemCount = itemCount + 1;
        }
        
        // create 3 items ==> tem02
        for (Integer i = 0; i < 3; i++) {
            iab__Template_Item__c item02 = new iab__Template_Item__c(
                Name                        = 'New Defined Story ' + itemCount,
                iab__Template__c            = tem02.Id,
                iab__Priority_Order__c	    = itemCount
            );
            tiList.add(item02);
            itemCount = itemCount + 1;
        }
        
        // create 3 items ==> tem03
        for (Integer i = 0; i < 3; i++) {
            iab__Template_Item__c item03 = new iab__Template_Item__c(
                Name                        = 'New Defined Story ' + itemCount,
                iab__Template__c            = tem03.Id,
                iab__Priority_Order__c	    = itemCount
            );
            tiList.add(item03);
            itemCount = itemCount + 1;
        }
        
        // create 3 items ==> tem04
        for (Integer i = 0; i < 3; i++) {
            iab__Template_Item__c item04 = new iab__Template_Item__c(
                Name                        = 'New Defined Story ' + itemCount,
                iab__Template__c            = tem04.Id,
                iab__Priority_Order__c	    = itemCount
            );
            tiList.add(item04);
            itemCount = itemCount + 1;
        }

        insert tiList;



        // *************************
        // TEST SCENARIOS (was Test Cases)
        // *************************
        
        // create test scenario list
        List<iab__Test_Scenario__c> testList = new List<iab__Test_Scenario__c>();

        // retrieve one of the Testing stories
        iab__Story__c testStory = [SELECT Id,iab__Release__c,iab__Status__c FROM iab__Story__c WHERE Name = 'Story for Test Scenario Testing' LIMIT 1];

        // create 3 test scenarios for this story
        iab__Test_Scenario__c test01 = new iab__Test_Scenario__c(
            iab__Story__c           = testStory.Id,
            iab__Description__c     = 'This is the description of the Not Ready to Test case.',
            iab__Expected_Result__c = 'This is the expected result of the test scenario.',
            iab__Instructions__c    = 'These are the instructions for conducting the test scenario.',
            iab__Status__c          = 'Not Ready to Test'
        );
        testList.add(test01);

        iab__Test_Scenario__c test02 = new iab__Test_Scenario__c(
            iab__Story__c           = testStory.Id,
            iab__Description__c     = 'This is the description of the Ready to Test case.',
            iab__Expected_Result__c = 'This is the expected result of the test scenario.',
            iab__Instructions__c    = 'These are the instructions for conducting the test scenario.',
            iab__Status__c          = 'Ready to Test'
        );
        testList.add(test02);

        iab__Test_Scenario__c test03 = new iab__Test_Scenario__c(
            iab__Story__c           = testStory.Id,
            iab__Description__c     = 'This is the description of the Test Completed case.',
            iab__Expected_Result__c = 'This is the expected result of the test scenario.',
            iab__Instructions__c    = 'These are the instructions for conducting the test scenario.',
            iab__Status__c          = 'Test Completed'
        );
        testList.add(test03);

        insert testList;



        // *************************
        // TEST RESULTS
        // *************************
        
        // create test results list
        List<iab__Test_Result__c> testResultList = new List<iab__Test_Result__c>();

        // create 3 test results for test02
        iab__Test_Result__c testResult01 = new iab__Test_Result__c(
            iab__Test_Scenario__c       = test02.Id,
            iab__Story__c               = testStory.Id,
            iab__Result__c              = 'Pass',
            iab__Status__c              = 'Reported'
        );
        testResultList.add(testResult01);

        iab__Test_Result__c testResult02 = new iab__Test_Result__c(
            iab__Test_Scenario__c       = test02.Id,
            iab__Story__c               = testStory.Id,
            iab__Result__c              = 'Fail',
            iab__Status__c              = 'Reported'
        );
        testResultList.add(testResult02);

        iab__Test_Result__c testResult03 = new iab__Test_Result__c(
            iab__Test_Scenario__c       = test02.Id,
            iab__Story__c               = testStory.Id,
            iab__Result__c              = 'Pass',
            iab__Status__c              = 'Reported'
        );
        testResultList.add(testResult03);

        insert testResultList;

        
        
    // *************************
    // METADATA COMPONENTS
    // *************************
    
    // create 3 Metadata Components for project02

    // create metadata component list
    List<iab__Metadata_Component__c> componentList = new List<iab__Metadata_Component__c>();
    
    iab__Metadata_Component__c component01  = new iab__Metadata_Component__c(
        iab__Project__c                     = project02.Id,
        Name                                = 'General - Test Flow for Testing',
        iab__API_Name__c                    = 'General_TestFlowForTesting',
        iab__Category__c			        = 'Custom',
        iab__Metadata_Type__c               = 'Flow',
        iab__Notes__c                       = 'Screen flow for testing purposes.'
    );
    componentList.add(component01);
    
    iab__Metadata_Component__c component02  = new iab__Metadata_Component__c(
        iab__Project__c                     = project02.Id,
        Name                                = 'Status',
        iab__API_Name__c                    = 'Status__c',
        iab__Category__c			        = 'Custom',
        iab__Metadata_Type__c               = 'Custom Field',
        iab__Notes__c                       = 'Picklist for for tracking status.'
    );
    componentList.add(component02);
    
    iab__Metadata_Component__c component03  = new iab__Metadata_Component__c(
        iab__Project__c                     = project02.Id,
        Name                                = 'Signup Layout',
        iab__API_Name__c                    = 'Signup_Layout',
        iab__Category__c			        = 'Custom',
        iab__Metadata_Type__c               = 'Page Layout',
        iab__Notes__c                       = 'This is the main page layout for the Signup object.'
    );
    componentList.add(component03);

    insert componentList;

        
        
    // *************************
    // METADATA COMPONENT CHANGES
    // *************************
    
    // create 3 Metadata Component Changes for testStory

    // create metadata component list
    List<iab__Metadata_Component_Change__c> changeList = new List<iab__Metadata_Component_Change__c>();
    
    // change for component01
    iab__Metadata_Component_Change__c changet01 = new iab__Metadata_Component_Change__c(
        iab__Change_Notes__c                    = 'Initial flow created.',
        iab__Change_Type__c                     = 'New',
        iab__Metadata_Component__c              = component01.Id,
        iab__Release__c                         = testStory.iab__Release__c,
        iab__Story__c                           = testStory.Id
    );
    changeList.add(changet01);
    
    // change for component02
    iab__Metadata_Component_Change__c changet02 = new iab__Metadata_Component_Change__c(
        iab__Change_Notes__c                    = 'Added new picklist value.',
        iab__Change_Type__c                     = 'Modified',
        iab__Metadata_Component__c              = component02.Id,
        iab__Release__c                         = testStory.iab__Release__c,
        iab__Story__c                           = testStory.Id
    );
    changeList.add(changet02);
    
    // change for component03
    iab__Metadata_Component_Change__c changet03 = new iab__Metadata_Component_Change__c(
        iab__Change_Notes__c                    = 'Rearranged fields into sections.',
        iab__Change_Type__c                     = 'Modified',
        iab__Metadata_Component__c              = component03.Id,
        iab__Release__c                         = testStory.iab__Release__c,
        iab__Story__c                           = testStory.Id
    );
    changeList.add(changet03);

    insert changeList;

}
    
    

    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    //                             ****************************************************************************************************************************************************************************
    // TESTS                       ****************************************************************************************************************************************************************************
    //                             ****************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************
    // ********************************************************************************************************************************************************************************************************



    // *************************
    // CUSTOM METADATA TYPES
    // *************************
    
    // tests ImhotepAppBuilderCtrl.getImhotepActiveMetadata()
    @isTest
    public static void testGetImhotepActiveMetadata(){
    
        // Test
        Test.startTest();
        
        iab__Imhotep_Config__mdt activeImhotepMetadata = ImhotepAppBuilderCtrl.getImhotepActiveMetadata();
        
        Test.stopTest();
        
        // Assertions
        system.assert(activeImhotepMetadata.iab__Active__c == true);

    }



    // *************************
    // METADATA COMPONENTS
    // *************************
    
    // tests ImhotepAppBuilderCtrl.getMetadataComponents()
    @isTest
    public static void testGetMetadataComponents() {
        
        // get the Id of the project with metadata components
        iab__Story__c storyWithMetadataComponents = [SELECT Id,iab__Project__c FROM iab__Story__c WHERE Name = 'Story for Test Scenario testing' LIMIT 1];

        // Test
        Test.startTest();

        // try to query with the story's project recordId
        try {
            List<iab__Metadata_Component__c> componentList = ImhotepAppBuilderCtrl.getMetadataComponents(storyWithMetadataComponents.iab__Project__c);

            // Assertions
            Assert.isNotNull(componentList);                     // is not empty
            Assert.isTrue(componentList.size() == 3);            // has 3 metadata components

        } catch (Exception e) {
            // Assertions
            Assert.fail('Fail - exception not expected but thrown');
        }

        Test.stopTest();
    }

    // tests ImhotepAppBuilderCtrl.getMetadataTypes()
    @isTest
    public static void testGetMetadataTypes() {
        
        // Test
        Test.startTest();

        try {
            List<String> typeList = ImhotepAppBuilderCtrl.getMetadataTypes();

            // Assertions
            Assert.isNotNull(typeList);                     // is not empty

        } catch (Exception e) {
            // Assertions
            Assert.fail('Fail - exception not expected but thrown');
        }

        Test.stopTest();
    }



    // *************************
    // METADATA COMPONENT CHANGES
    // *************************
    
    // tests ImhotepAppBuilderCtrl.getStoryChanges()
    @isTest
    public static void testGetStoryChanges() {

        // get the Id of the story with metadata changes
        iab__Story__c storyWithMetadata = [SELECT Id FROM iab__Story__c WHERE Name = 'Story for Test Scenario testing' LIMIT 1];

        // Test
        Test.startTest();

        // set a boolean flag
        Boolean isException = false;

        // try to query with the story recordId
        try {
            List<iab__Metadata_Component_Change__c> changeList = ImhotepAppBuilderCtrl.getStoryChanges(storyWithMetadata.Id);

            // Assertions
            Assert.isNotNull(changeList);                     // is not empty
            Assert.isTrue(changeList.size() == 3);            // has 3 metadata component changes

        } catch (Exception e) {
            // Assertions
            Assert.fail('Fail - exception not expected but thrown');
        }

        Test.stopTest();

    }
    
    // tests ImhotepAppBuilderCtrl.getStoryChanges() when there's an exception thrown
    @isTest
    public static void testGetStoryChangesException() {

        // set a fake story recordId so you can test catching the exception
        String fakeStoryId = '123456789012345';

        // Test
        Test.startTest();

        // try to query with the fake story recordId
        try {
            List<iab__Metadata_Component_Change__c> changeList02 = ImhotepAppBuilderCtrl.getStoryChanges(fakeStoryId);
        } catch (Exception e) {
            // Assertions
            Assert.isTrue(true, 'Success - exception expected and thrown');
        }

        Test.stopTest();
    }


    
    // tests ImhotepAppBuilderCtrl.getReleaseChanges()
    @isTest
    public static void testGetReleaseChanges() {

        // get the Id of the release with metadata changes
        iab__Release__c releaseWithMetadata = [SELECT Id FROM iab__Release__c WHERE Name = 'MVP' LIMIT 1];

        // Test
        Test.startTest();

        // set a boolean flag
        Boolean isException = false;

        // try to query with the release recordId
        try {
            List<iab__Metadata_Component_Change__c> changeList = ImhotepAppBuilderCtrl.getReleaseChanges(releaseWithMetadata.Id);

            // Assertions
            Assert.isNotNull(changeList);                     // is not empty
            Assert.isTrue(changeList.size() == 3);            // has 3 metadata component changes

        } catch (Exception e) {
            // Assertions
            Assert.fail('Fail - exception not expected but thrown');
        }

        Test.stopTest();

    }
    
    // tests ImhotepAppBuilderCtrl.getReleaseChanges() when there's an exception thrown
    @isTest
    public static void testGetReleaseChangesException() {

        // set a fake release recordId so you can test catching the exception
        String fakeReleaseId = '123456789012345';

        // Test
        Test.startTest();

        // try to query with the fake release recordId
        try {
            List<iab__Metadata_Component_Change__c> changeList02 = ImhotepAppBuilderCtrl.getReleaseChanges(fakeReleaseId);
        } catch (Exception e) {
            // Assertions
            Assert.isTrue(true, 'Success - exception expected and thrown');
        }

        Test.stopTest();
    }



    // *************************
    // PROJECTS
    // *************************
    
    // tests ImhotepAppBuilderCtrl.getProjectId() when Id = project
    @isTest
    public static void testGetProjectIdIfProject(){

        // get project02
        iab__Project__c resProject = [SELECT Id,Name FROM iab__Project__c WHERE Name = 'Project 2 - Active' LIMIT 1];

        // Test
        Test.startTest();

        String projectId = ImhotepAppBuilderCtrl.getProjectId(resProject.Id);

        Test.stopTest();

        // Assertions
        Assert.isNotNull(projectId);    // is not empty
    }

    // tests ImhotepAppBuilderCtrl.getProjectId() when Id = release
    @isTest
    public static void testGetProjectIdIfRelease(){

        // get project02
        iab__Project__c resProject = [SELECT Id,Name FROM iab__Project__c WHERE Name = 'Project 2 - Active' LIMIT 1];

        // get project02's MVP release
        iab__Release__c resRelease = [SELECT Id,Name FROM iab__Release__c WHERE iab__Project__c = :resProject.Id AND Name = 'MVP' LIMIT 1];

        // Test
        Test.startTest();

        String projectId = ImhotepAppBuilderCtrl.getProjectId(resRelease.Id);

        Test.stopTest();

        // Assertions
        Assert.isNotNull(projectId);    // is not empty
    }

    // tests ImhotepAppBuilderCtrl.getProjectId() when Id = story
    @isTest
    public static void testGetProjectIdIfStory(){

        // get project02
        iab__Project__c resProject = [SELECT Id,Name FROM iab__Project__c WHERE Name = 'Project 2 - Active' LIMIT 1];

        // get project02's MVP release
        iab__Release__c resRelease = [SELECT Id,Name FROM iab__Release__c WHERE iab__Project__c = :resProject.Id AND Name = 'MVP' LIMIT 1];

        // get a story from the MVP release
        iab__Story__c resStory = [SELECT Id,Name FROM iab__Story__c WHERE iab__Release__c = :resRelease.Id LIMIT 1];

        // Test
        Test.startTest();

        String projectId = ImhotepAppBuilderCtrl.getProjectId(resStory.Id);

        Test.stopTest();

        // Assertions
        Assert.isNotNull(projectId);    // is not empty
    }
    
    

    // *************************
    // PROJECT MEMBERS
    // *************************
    
    // tests ImhotepAppBuilderCtrl.getProjectsByMembership()
    @isTest
    public static void testGetProjectsByMembership(){
        
        // get current user
        User testuser = [SELECT Id,FirstName,LastName FROM User WHERE Id = :UserInfo.getUserId()];
        
        // Test
        Test.startTest();

        List<List<iab__Project_Member__c>> allProjectMembers = ImhotepAppBuilderCtrl.getProjectsByMembership(testuser.Id);

        List<iab__Project_Member__c> planningList = allProjectMembers[0];
        List<iab__Project_Member__c> activeList = allProjectMembers[1];
        List<iab__Project_Member__c> completedList = allProjectMembers[2];

        Test.stopTest();

        // Assertions
        system.assert(allProjectMembers.isEmpty() == false);
        
        system.assert(planningList.size() == 1);
        system.assert(activeList.size() == 3);
        system.assert(completedList.size() == 1);
        
    }



    // tests ImhotepAppBuilderCtrl.getProjectMembers()
    @isTest
    public static void testGetProjectMembers(){
        
        // get project02
        iab__Project__c testproject = [SELECT Id,Name FROM iab__Project__c WHERE Name = 'Project 2 - Active'];
        
        // Test
        Test.startTest();

        List<iab__Project_Member__c> allProjectMembers = ImhotepAppBuilderCtrl.getProjectMembers(testproject.Id);

        Test.stopTest();

        // Assertions
        system.assert(allProjectMembers.isEmpty() == false);
        
        system.assert(allProjectMembers.size() == 1);
        
    }



    // *************************
    // RESOURCE LINKS (was Project Resources)
    // *************************



    // tests ImhotepAppBuilderCtrl.getResourceLinks() when Id = project
    @isTest
    public static void testGetResourceLinksIfProject(){

        // get project02
        iab__Project__c resProject = [SELECT Id,Name FROM iab__Project__c WHERE Name = 'Project 2 - Active' LIMIT 1];

        // Test
        Test.startTest();

        List<iab__Resource_Link__c> allResourceLinks = ImhotepAppBuilderCtrl.getResourceLinks(resProject.Id);

        Test.stopTest();

        // Assertions
        Assert.isNotNull(allResourceLinks);                     // is not empty
        Assert.isTrue(allResourceLinks.size() == 3);            // has 3 test case records
    }

    // tests ImhotepAppBuilderCtrl.getResourceLinks() when Id = release
    @isTest
    public static void testGetResourceLinksIfRelease(){

        // get project02
        iab__Project__c resProject = [SELECT Id,Name FROM iab__Project__c WHERE Name = 'Project 2 - Active' LIMIT 1];

        // get project02's MVP release
        iab__Release__c resRelease = [SELECT Id,Name FROM iab__Release__c WHERE iab__Project__c = :resProject.Id AND Name = 'MVP' LIMIT 1];

        // Test
        Test.startTest();

        List<iab__Resource_Link__c> allResourceLinks = ImhotepAppBuilderCtrl.getResourceLinks(resRelease.Id);

        Test.stopTest();

        // Assertions
        Assert.isNotNull(allResourceLinks);                     // is not empty
        Assert.isTrue(allResourceLinks.size() == 3);            // has 3 test case records
    }

    // tests ImhotepAppBuilderCtrl.getResourceLinks() when Id = story
    @isTest
    public static void testGetResourceLinksIfStory(){

        // get project02
        iab__Project__c resProject = [SELECT Id,Name FROM iab__Project__c WHERE Name = 'Project 2 - Active' LIMIT 1];

        // get project02's MVP release
        iab__Release__c resRelease = [SELECT Id,Name FROM iab__Release__c WHERE iab__Project__c = :resProject.Id AND Name = 'MVP' LIMIT 1];

        // get a story from the MVP release
        iab__Story__c resStory = [SELECT Id,Name FROM iab__Story__c WHERE iab__Release__c = :resRelease.Id LIMIT 1];

        // Test
        Test.startTest();

        List<iab__Resource_Link__c> allResourceLinks = ImhotepAppBuilderCtrl.getResourceLinks(resStory.Id);

        Test.stopTest();

        // Assertions
        Assert.isNotNull(allResourceLinks);                     // is not empty
        Assert.isTrue(allResourceLinks.size() == 3);            // has 3 test case records
    }



    // *************************
    // RELEASES
    // *************************

    // tests ImhotepAppBuilderCtrl.getAllReleases()
    @isTest
    public static void testGetAllReleases(){
        
        // Test
        Test.startTest();

        // Test #1 for active releases (size = 2)
        List<iab__Release__c> allActiveReleases = ImhotepAppBuilderCtrl.getAllReleases('Active',false);

        // Test #2 for backlog releases (size = 2)
        List<iab__Release__c> allBacklogReleases = ImhotepAppBuilderCtrl.getAllReleases('Planning',true);

        // Test #3 for accepted releases (size = 1)
        List<iab__Release__c> allAcceptedReleases = ImhotepAppBuilderCtrl.getAllReleases('Accepted',false);

        Test.stopTest();

        // Assertions
        system.assert(allActiveReleases.isEmpty() == false);
        system.assert(allActiveReleases.size() == 2);
        
        system.assert(allBacklogReleases.isEmpty() == false);
        system.assert(allBacklogReleases.size() == 2);

        system.assert(allAcceptedReleases.isEmpty() == false);
        system.assert(allAcceptedReleases.size() == 1);
        
    }



    // tests ImhotepAppBuilderCtrl.getReleaseLists()
    @isTest
    public static void testGetReleaseLists(){

        // get project02
        iab__Project__c testproject = [SELECT Id,Name FROM iab__Project__c WHERE Name = 'Project 4 - Active'];

        // Test
        Test.startTest();

        List<List<iab__Release__c>> allReleases = ImhotepAppBuilderCtrl.getReleaseLists(testproject.Id);

        List<iab__Release__c> planningList = allReleases[0];
        List<iab__Release__c> activeList = allReleases[1];
        List<iab__Release__c> acceptedList = allReleases[2];
        List<iab__Release__c> backlogList = allReleases[3];

        Test.stopTest();

        // Assertions
        system.assert(allReleases.isEmpty() == false);
        
        system.assert(planningList.size() == 1);            // should have 1
        system.assert(activeList.size() == 1);              // should have 1
        system.assert(acceptedList.size() == 1);            // should have 1
        system.assert(backlogList.size() == 1);             // should have 1

    }



    // *************************
    // STORIES
    // *************************

    // tests ImhotepAppBuilderCtrl.getStoriesByRelease()
    @isTest
    public static void testGetStoriesByRelease(){
        
        // get Release Id for MVP
        iab__Release__c release = [SELECT Id,Name FROM iab__Release__c WHERE Name = 'MVP Backlog' LIMIT 1];
        
        // Test
        Test.startTest();

        List<iab__Story__c> allStories = ImhotepAppBuilderCtrl.getStoriesByRelease(release.Id);

        Test.stopTest();

        // Assertions
        system.assert(allStories.isEmpty() == false);
        system.assert(allStories.size() == 6);
        
    }



    // tests ImhotepAppBuilderCtrl.getStoriesByStatus()
    @isTest
    public static void testGetStoriesByStatus(){
        
        // get Release Id for MVP
        iab__Release__c release = [SELECT Id,Name FROM iab__Release__c WHERE Name = 'MVP' LIMIT 1];
        
        // Test
        Test.startTest();

        List<List<iab__Story__c>> allStories = ImhotepAppBuilderCtrl.getStoriesByStatus(release.Id);

        List<iab__Story__c> blockedList = allStories[0];
        List<iab__Story__c> definedList = allStories[1];
        List<iab__Story__c> buildingList = allStories[2];
        List<iab__Story__c> testingList = allStories[3];
        List<iab__Story__c> readyList = allStories[4];
        List<iab__Story__c> deployedList = allStories[5];

        Test.stopTest();

        // Assertions
        system.assert(allStories.isEmpty() == false);
        
        system.assert(blockedList.size() == 1);
        system.assert(definedList.size() == 2);
        system.assert(buildingList.size() == 3);
        system.assert(testingList.size() == 5);
        system.assert(readyList.size() == 5);
        system.assert(deployedList.size() == 6);
        
    }



    // tests ImhotepAppBuilderCtrl.moveStory()
    @isTest
    public static void testMoveStory() {
        
        // get Release Id for MVP
        iab__Release__c release = [SELECT Id,Name FROM iab__Release__c WHERE Name = 'MVP' LIMIT 1];
        
        // get one of the Building stories
        iab__Story__c story = [SELECT Id,iab__Release__c,iab__Status__c FROM iab__Story__c WHERE iab__Release__c = :release.Id AND iab__Status__c = 'Building' LIMIT 1];
        
        // update the status value
        String newstatus = 'Testing';
        
        // Test
        Test.startTest();
        
        iab__Story__c updatedstory = ImhotepAppBuilderCtrl.moveStory(story.Id,newstatus);
        
        Test.stopTest();
        
        // Assertions
        system.assert(updatedstory.iab__Status__c == 'Testing');

    }



    // tests ImhotepAppBuilderCtrl.saveReorderedStories()
    @isTest
    public static void testSaveReorderedStories() {
        
        // get Release Id for 'MVP Backlog' (6 stories)
        iab__Release__c release = [SELECT Id,Name FROM iab__Release__c WHERE Name = 'MVP Backlog' LIMIT 1];

        // get all related stories using getStoriesByRelease()
        List<iab__Story__c> originalStoryList = ImhotepAppBuilderCtrl.getStoriesByRelease(release.Id);

        // save the record Id for the first story in the list (#1 story that will be #6)
        Id originalFirstStoryId = originalStoryList[0].Id;

        // create a var for storing the record Id for the story in the reordered list (#6 story that will be #1)
        Id reversedFirstStoryId;

        // create a map for storing stories in reverse order
        Map<Id,Decimal> reversedStoryMap = new Map<Id,Decimal>();

        Integer storyCount = 6;
        for (iab__Story__c story : originalStoryList) {
            if(storyCount == 1) {
                // this should become the first story in the list 
                reversedFirstStoryId = story.Id;
            }
            
            // add to the map
            reversedStoryMap.put(story.Id, storyCount);
            
            // decrement the counter
            storyCount = storyCount - 1;
        }

        // serialize the map using JSON class
        // String serializedStoryMap = JSON.serialize(reversedStoryMap);
        
        // Test
        Test.startTest();
        
        // reorder stories by passing map to the method
        // Integer updatedStoryCount = ImhotepAppBuilderCtrl.saveReorderedStories(serializedStoryMap);
        Integer updatedStoryCount = ImhotepAppBuilderCtrl.saveReorderedStories(reversedStoryMap);

        // query to get all updated stories that should now be in reverse order
        List<iab__Story__c> updatedStoryList = ImhotepAppBuilderCtrl.getStoriesByRelease(release.Id);
        
        Test.stopTest();
        
        // Assertions

        // count stories (updatedStoryCount should be 6)
        system.assert(updatedStoryCount == 6);

        // count stories (updatedStoryList.size() should be 6)
        system.assert(updatedStoryList.size() == 6);

        // compare updatedStoryList[0].Id to originalFirstStoryId (should be different)
        system.assertNotEquals(updatedStoryList[0].Id, originalFirstStoryId);
        
        // compare updatedStoryList[0].Id to reversedFirstStoryId (should be the same)
        system.assert(updatedStoryList[0].Id == reversedFirstStoryId);

        // compare updatedStoryList[0].Id to the last of the first list; if they match, the reordering took place
        system.assert(updatedStoryList[5].Id == originalFirstStoryId);

    }



    // *************************
    // TAGS
    // *************************

    // tests ImhotepAppBuilderCtrl.getActiveProjectTagRecords()
    @isTest
    public static void testGetActiveProjectTagRecords() {
        
        // get project02
        iab__Project__c testproject = [SELECT Id FROM iab__Project__c WHERE Name = 'Project 2 - Active'];
        
        // Test
        Test.startTest();
        
        List<iab__Tag__c> tagList = ImhotepAppBuilderCtrl.getActiveProjectTagRecords(testproject.Id);
        
        Test.stopTest();
        
        // Assertions
        system.assert(tagList.isEmpty() == false);
        
        system.assert(tagList.size() == 3);
        
    }



    // *************************
    // TAG ASSIGNMENTS
    // *************************

    // tests ImhotepAppBuilderCtrl.getStoryTagAssignmentRecords()
    @isTest
    public static void testGetStoryTagAssignmentRecords() {
        
        // get 1 story for project02 where status = Blocked
        iab__Story__c buildingStory = [SELECT Id,Name FROM iab__Story__c WHERE Name = 'New Blocked Story' LIMIT 1];
        
        // Test
        Test.startTest();
        
        List<iab__Tag_Assignment__c> assignmentList = ImhotepAppBuilderCtrl.getStoryTagAssignmentRecords(buildingStory.Id);
        
        Test.stopTest();
        
        // Assertions
        system.assert(assignmentList.isEmpty() == false);
        
        system.assert(assignmentList.size() == 2);
    }

    // tests ImhotepAppBuilderCtrl.getTagAssignmentRecords()
    @isTest
    public static void testTagAssignmentRecords() {

        // get tag called 'Test Tag 01'
        iab__Tag__c testTag = [SELECT Id,Name FROM iab__Tag__c WHERE Name = 'Test Tag 01' LIMIT 1];
        
        // Test
        Test.startTest();
        
        // test the "All" parameter
        List<iab__Tag_Assignment__c> tagAssignmentsAll = ImhotepAppBuilderCtrl.getTagAssignmentRecords(testTag.Id,'All');

        // test the "Active Release" parameter
        List<iab__Tag_Assignment__c> tagAssignmentsActive = ImhotepAppBuilderCtrl.getTagAssignmentRecords(testTag.Id,'Active Release');
        
        Test.stopTest();
        
        // Assertions
        system.assert(tagAssignmentsAll.isEmpty() == false);
        system.assert(tagAssignmentsAll.size() == 1);

        system.assert(tagAssignmentsActive.isEmpty() == false);
        system.assert(tagAssignmentsActive.size() == 1);
    }



    // *************************
    // TEMPLATES
    // *************************

    // tests ImhotepAppBuilderCtrl.getTemplatesByType()
    @isTest
    public static void testGetTemplatesByType() {
        
        // Test
        Test.startTest();

        List<List<iab__Template__c>> allTemplates = ImhotepAppBuilderCtrl.getTemplatesByType();

        List<iab__Template__c> temList01 = allTemplates[0];
        List<iab__Template__c> temList02 = allTemplates[1];
        List<iab__Template__c> temList03 = allTemplates[2];

        Test.stopTest();

        // Assertions
        system.assert(temList01.isEmpty() == false);
        system.assert(temList01.size() == 2);

        system.assert(temList02.isEmpty() == false);
        system.assert(temList02.size() == 2);

        system.assert(temList03.isEmpty() == true);

    }



    // *************************
    // TEMPLATE ITEMS
    // *************************

    // tests ImhotepAppBuilderCtrl.getTemplateItemsForType()
    @isTest
    public static void testGetTemplateItemsForType() {
        
        // Test
        Test.startTest();

        // Test #1 for template items (Mine)
        List<iab__Template_Item__c> myTemplateItems = ImhotepAppBuilderCtrl.getTemplateItemsForType('Mine');

        // Test #2 for template items (Standard)
        List<iab__Template_Item__c> standardTemplateItems = ImhotepAppBuilderCtrl.getTemplateItemsForType('Standard');

        // Test #3 for template items (Mine)
        List<iab__Template_Item__c> sharedTemplateItems = ImhotepAppBuilderCtrl.getTemplateItemsForType('Shared');

        Test.stopTest();

        // Assertions
        system.assert(myTemplateItems.isEmpty() == false);
        system.assert(myTemplateItems.size() == 6);
        
        system.assert(standardTemplateItems.isEmpty() == false);
        system.assert(standardTemplateItems.size() == 6);
        
        system.assert(sharedTemplateItems.isEmpty() == true);

    }




    // *************************
    // TEST SCENARIOS (was Test Cases)
    // *************************

    // tests ImhotepAppBuilderCtrl.getTestScenariosWithTestResults()
    @isTest
    public static void testGetTestScenariosWithTestResults() {

        // get the Id of the story with test cases and test results
        iab__Story__c storyWithTests = [SELECT Id FROM iab__Story__c WHERE Name = 'Story for Test Scenario testing' LIMIT 1];

        // Test
        Test.startTest();

        // set a boolean flag
        Boolean isException = false;

        // try to query with the story recordId
        try {
            List<iab__Test_Scenario__c> testCaseList = ImhotepAppBuilderCtrl.getTestScenariosWithTestResults(storyWithTests.Id);

            // save the list of child records on the second test case in the list (the "Ready to Test" one)
            List<iab__Test_Result__c> testResultList = testCaseList[1].iab__Test_Results__r;

            // Assertions
            Assert.isNotNull(testCaseList);                     // is not empty
            Assert.isTrue(testCaseList.size() == 3);            // has 3 test case records
            Assert.isNotNull(testResultList);                   // is not empty
            Assert.isTrue(testResultList.size() == 3);          // has 3 test result records

        } catch (Exception e) {
            // Assertions
            Assert.fail('Fail - exception not expected but thrown');
        }

        Test.stopTest();

    }

    // tests ImhotepAppBuilderCtrl.getTestScenariosWithTestResults() when there's an exception thrown
    @isTest
    public static void testGetTestScenariosWithTestResultsException() {

        // set a fake story recordId so you can test catching the exception
        String fakeStoryId = '123456789012345';

        // Test
        Test.startTest();

        // try to query with the fake story recordId
        try {
            List<iab__Test_Scenario__c> testCaseList02 = ImhotepAppBuilderCtrl.getTestScenariosWithTestResults(fakeStoryId);
        } catch (Exception e) {
            // Assertions
            Assert.isTrue(true, 'Success - exception expected and thrown');
        }

        Test.stopTest();
    }



    // *************************
    // USER RECORD ACCESS
    // *************************

    // tests ImhotepAppBuilderCtrl.checkUserEditAccess()
    @isTest
    public static void testCheckUserEditAccess() {
        
        // get MVP release for project02
        iab__Release__c testrelease = [SELECT Id FROM iab__Release__c WHERE Name = 'MVP'];

        // get current user
        User testuser = [SELECT Id,FirstName,LastName FROM User WHERE Id = :UserInfo.getUserId()];

        // Test
        Test.startTest();
        
        Boolean haseditaccess = ImhotepAppBuilderCtrl.checkUserEditAccess(testrelease.Id,testuser.Id);
        
        Test.stopTest();
        
        // Assertions
        system.assert(haseditaccess, 'This user does not have edit access');
    }



}