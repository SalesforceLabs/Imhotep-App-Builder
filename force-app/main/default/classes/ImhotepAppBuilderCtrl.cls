/*******************************************************************************************
* @Name         ImhotepAppBuilderCtrl.apxc
* @Author       Mitch Lynch (mitch.lynch@salesforce.com)
* @Date         10/13/2022
* @Description  Provides methods used across the Imhotep App Builder
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
*   07/24/2024  Mitch Lynch         S000093     Added getReleaseChanges() method.
*   07/11/2024  Mitch Lynch         S000369     Added getMetadataComponents() method.
*   06/30/2024  Mitch Lynch         S000369     Added getMetadataTypes() method.
*   06/22/2024  Mitch Lynch         S000366     Added iab__Metadata_Change_Menu_Actions__c to the getImhotepActiveMetadata() method.
*   06/18/2024  Mitch Lynch         S000366     Added getStoryChanges() method.
*   06/06/2024  Mitch Lynch         S000044     Recovered from Salesforce Code Analyzer scans.
*   06/04/2024  Mitch Lynch         S000037     Modified format of input parameters from String to Id to better validate the input and protect against SOQL injection in the following methods:
*                                                   - DONE getProjectsByMembership(ParamUserId)
*                                                   - DONE getProjectMembers(Id ParamProjectId)
*                                                   - DONE getReleaseLists(Id ParamProjectId)
*                                                   - DONE getStoriesByRelease(Id ParamReleaseId)
*                                                   - DONE getStoriesByStatus(Id ParamReleaseId)
*                                                   - DONE getStoryTagAssignmentRecords(Id ParamStoryId)
*                                                   - DONE getTagAssignmentRecords(Id ParamTagId)
*                                                   - DONE getTestScenariosWithTestResults(Id ParamStoryId)
*                                                   - DONE saveReorderedStories(Map<Id,Decimal> orderedMap)
*   06/02/2024  Mitch Lynch         S000033     Added iab__Documentation_URL__c to getImhotepActiveMetadata().
*   05/24/2024  Mitch Lynch         S000486     Reworked the class to work in the new org.
*                                                   - renamed getProjectResources() to getResourceLinks().
*                                                   - renamed getTestCasesWithTestResults() to getTestScenariosWithTestResults().
*
*   LEGACY ORG PACKAGE CHANGES:
*   01/14/2024  Mitch Lynch         S-000417    Added FLS checks as identified by Checkmarx to moveStory() and saveReorderedStories().
*   08/26/2023  Mitch Lynch         S-000402    For getStoriesByRelease(), added additional field to query (imhotep__Story_Description__c).
*   08/26/2023  Mitch Lynch         S-000394    For getImhotepActiveMetadata(), added additional field to query (imhotep__Story_Edit__c).
*   08/26/2023  Mitch Lynch         S-000329    For getImhotepActiveMetadata(), added additional field to query (imhotep__Story_Clone__c).
*   08/18/2023  Mitch Lynch         S-000102    Updated getStoriesByRelease() to replace the Project Member-related user fields with the new Assigned_User__c formula field on Story__c. Added imhotep__Release_Delete_Story__c to getImhotepActiveMetadata().
*   08/17/2023  Mitch Lynch         S-000102    Added saveReorderedStories() to support the imhotepStoryList LWC... probably replaces the need for reorderStory().
*   08/14/2023  Mitch Lynch         S-000102    Added getStoriesByRelease() to support the imhotepStoryList LWC.
*   07/01/2023  Mitch Lynch         S-000335    For getImhotepActiveMetadata(), added additional fields to return (Project_Resource_New__c, Project_Resource_Menu_Actions__c)
*   07/01/2023  Mitch Lynch         S-000329    Added getProjectId() method, which was based on getProjectResources().
*   06/30/2023  Mitch Lynch         S-000329    For getImhotepActiveMetadata(), added additional fields to return (Current_Release_Date__c, Current_Release_Version__c).
*   06/30/2023  Mitch Lynch         S-000336    Removed getTestCases(), which was replaced by getTestCasesWithTestResults(). It was dragging down test coverage so it has been commented out.
*   06/28/2023  Mitch Lynch         S-000315    Added imhotep__Project_Delete_Tag__c to getImhotepActiveMetadata().
*   06/26/2023  Mitch Lynch         S-000315    Added imhotep__Story_Remove_Tag_Assignment__c to getImhotepActiveMetadata().
*   06/20/2023  Mitch Lynch         000077      For getTestCasesWithTestResults(), added "ORDER BY Name ASC" clause for the embedded relationship query.
*   06/06/2023  Mitch Lynch         000077      Added the imhotep__Story_Test_Case_Menu_Actions__c and imhotep__Story_Test_Result_Menu_Actions__c fields to the query for getImhotepActiveMetadata().
*   06/01/2023  Mitch Lynch         000050      Added getProjectResources() method to support the new imhotepProjectResourcesBar LWC.
*   03/07/2023  Mitch Lynch         S-000298    Added getImhotepActiveMetadata(). Used to retrieve custom metadata for components rather than using design attributes.  To update the Release record type, see the active imhotep__Imhotep_App_Builder_Setting__mdt custom metadata type record.
*   03/04/2023  Mitch Lynch         S-000188    Added getTemplatesByType().
*   02/28/2023  Mitch Lynch         S-000183    Rewrote getProjectsByMembership() to use a parameter for current user Id that's passed from the Aura controller, rather than calculated in the method, so it would be more testable.
*   02/25/2023  Mitch Lynch         S-000183    Merge ImhotepProjectsCtrl and ImhotepReleaseKanbanCtrl into ImhotepAppBuilder.
*   02/24/2023  Mitch Lynch         S-000180    Renamed devImhotepAppBuilderCtrl to ImhotepAppBuilderCtrl (also devProjectsCtrl to ImhotepProjectsCtrl and devReleaseKanbanCtrl to ImhotepReleaseKanbanCtrl).
*   02/24/2023  Mitch Lynch         000079      Updated imhotep__Assigned__c to use imhotep__Assigned_Project_Member__c.
*   02/21/2023  Mitch Lynch         S-000166    Updated to use namespace "imhotep".
*   10/29/2022  Mitch Lynch         S-000103    Added getTagAssignmentRecords() - moved from the devTagStoriesCtrl so it could be retired.
*   10/26/2022  Mitch Lynch         000077      Added getTestCases() method to support devStoryTestCases component.
*   10/24/2022  Mitch Lynch         S-000101    Added moveStory() method for drag-and-drop Kanban support; replaces need for updateStoryStatus().
*	10/16/2022	Mitch Lynch			S-00010		Added getReleaseLists() method to support the devProjectReleases component.
*	10/15/2022	Mitch Lynch			000053		Added getProjectMembers for devProjectMembers component. Added getProjectsByMembership to switch to a query for Projects through Project_Member__c records for the current user (no longer need getProjectLists).
*	10/13/2022	Mitch Lynch			unknown		Initial creation - original devImhotepAppBuilderCtrl.
*	09/26/2022	Mitch Lynch			000070		Added getAllReleases() method to query all releases together.
*	09/25/2022	Mitch Lynch			000070		Initial creation - original devProjectsCtrl.
*	09/25/2022	Mitch Lynch			000064		Completion of final logic for updateStoryStatus() and test coverage for all methods.
*	09/24/2022	Mitch Lynch			000064		Added updateStoryStatus() to promote/demote Story Status to the next/previous value in the picklist.
*	04/20/2022	Mitch Lynch			unknown		Added Assigned__c related fields.
*	04/12/2022	Mitch Lynch			unknown		Initial creation - original devReleaseKanbanCtrl.
*******************************************************************************************/

public with sharing class ImhotepAppBuilderCtrl {


    
    // *************************
    // CUSTOM METADATA TYPES
    // *************************

    // getImhotepActiveMetadata()
    // queries for the active iab__Imhotep_Config__mdt record
    // used by: devKanbanRelease, devProjectMembers, devProjectReleases, devProjectTags, devProjectTiles, devStoryTags, devStoryTestScenarios, imhotepAppCard, imhotepResourceBar, and imhotepStoryList components
    @AuraEnabled(cacheable=true)
    public static iab__Imhotep_Config__mdt getImhotepActiveMetadata() {
        
        // Check if the user has read access to the custom metadata type
        if (Schema.sObjectType.iab__Imhotep_Config__mdt.isAccessible()) {
            // get the custom metadata record (just the active one)
            iab__Imhotep_Config__mdt activeImhotepMetadata = 
                [ 
                    SELECT Id, DeveloperName, iab__Active__c, iab__Current_Release_Version__c, iab__Current_Release_Date__c, iab__Documentation_URL__c, iab__General_New_Project__c, iab__Metadata_Change_Menu_Actions__c, iab__Project_Add_Metadata_Component__c, iab__Project_Create_Release_from_Template__c, iab__Project_Delete_Project_Member__c, iab__Project_Delete_Tag__c, iab__Project_New_Project_Member__c, iab__Project_Update_Project_Member__c, iab__Project_New_Release__c, iab__Project_New_Tag__c, iab__Release_Add_Template_to_Release__c, iab__Release_Create_Template_from_Release__c, iab__Release_Delete_Story__c, iab__Release_New_Story__c, iab__Resource_Link_Menu_Actions__c, iab__Resource_Link_New__c, iab__Story_Clone__c, iab__Story_Edit__c, iab__Story_Log_Change__c, iab__Story_New_Tag_Assignment__c, iab__Story_New_Test_Scenario__c, iab__Story_Transfer__c, iab__Story_Remove_Tag_Assignment__c, iab__Story_Test_Scenario_Menu_Actions__c, iab__Story_Test_Result_Menu_Actions__c, iab__Template_Clone__c
                    FROM iab__Imhotep_Config__mdt
                    WHERE iab__Active__c = true
                    ORDER BY DeveloperName DESC
                    LIMIT 1
                ];
            
            return activeImhotepMetadata;
        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Imhotep Config custom metadata.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }

    }
    

    
    // *************************
    // METADATA COMPONENTS
    // *************************

    // getMetadataComponents()
    // retrieve all iab__Metadata_Component__c records for a specific iab__Project__c
    // used by: imhotepFlowMetadataTypeActionList component
    @AuraEnabled(cacheable=true)
    public static List<iab__Metadata_Component__c> getMetadataComponents(Id paramProjectId){
        // Check if the user has read access to iab__Metadata_Component__c
        if (Schema.sObjectType.iab__Metadata_Component__c.isAccessible()) {

            return [
                SELECT Id,Name,iab__API_Name__c,iab__Metadata_Type__c
                FROM iab__Metadata_Component__c
                WHERE iab__Project__c = :paramProjectId
                AND iab__Is_Deleted__c = FALSE
                WITH USER_MODE
                ORDER BY Name ASC
            ];

        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Metadata Components.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }
        
    }



    // getMetadataTypes()
    // retrieves all iab__Metadata_Type__c picklist values
    // used by: imhotepFlowMetadataTypeActionList component
    @AuraEnabled(cacheable=true)
    public static List<String> getMetadataTypes() {
        // Check if the user has read access to iab__Metadata_Component__c
        if (Schema.sObjectType.iab__Metadata_Component__c.isAccessible()) {
            Schema.DescribeFieldResult fieldResult = Schema.getGlobalDescribe().get('iab__Metadata_Component__c').getDescribe().fields.getMap().get('iab__Metadata_Type__c').getDescribe();
            List<Schema.PicklistEntry> picklistEntries = fieldResult.getPicklistValues();
            List<String> picklistValues = new List<String>();
            for (Schema.PicklistEntry entry : picklistEntries) {
                picklistValues.add(entry.getLabel());
            }
            return picklistValues;
        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Metadata Components.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }
    }
    

    
    // *************************
    // METADATA COMPONENT CHANGES
    // *************************

    // getStoryChanges()
    // get all iab__Metadata_Component_Change__c records related to a specific iab__Story__c
    // used by: imhotepStoryChanges component
    @AuraEnabled(cacheable=true)
    public static List<iab__Metadata_Component_Change__c> getStoryChanges(Id paramStoryId){
        // Check if the user has read access to iab__Metadata_Component_Change__c and iab__Metadata_Component__c
        if (Schema.sObjectType.iab__Metadata_Component_Change__c.isAccessible() && Schema.sObjectType.iab__Metadata_Component__c.isAccessible()) {

            return [
                SELECT Id,Name,iab__Change_Notes__c,iab__Change_Type__c,LastModifiedDate,iab__Metadata_Component__c,iab__Metadata_Component__r.Name,iab__Metadata_Type__c
                FROM iab__Metadata_Component_Change__c
                WHERE iab__Story__c = :paramStoryId
                WITH USER_MODE
                ORDER BY LastModifiedDate DESC
            ];

        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Metadata Component Changes.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }
        
    }



    // getReleaseChanges()
    // get all iab__Metadata_Component_Change__c records related to a specific iab__Release__c
    // used by: imhotepReleaseChanges component
    @AuraEnabled(cacheable=true)
    public static List<iab__Metadata_Component_Change__c> getReleaseChanges(Id paramReleaseId){
        // Check if the user has read access to iab__Metadata_Component_Change__c and iab__Metadata_Component__c
        if (Schema.sObjectType.iab__Metadata_Component_Change__c.isAccessible() && Schema.sObjectType.iab__Metadata_Component__c.isAccessible()) {

            return [
                SELECT Id,Name,iab__Change_Notes__c,iab__Change_Type__c,LastModifiedDate,iab__Metadata_Component__c,iab__Metadata_Component__r.Name,iab__Metadata_Type__c,iab__Story__c,iab__Story__r.Name,iab__Story__r.iab__Story_Number__c,iab__Story__r.iab__Status__c
                FROM iab__Metadata_Component_Change__c
                WHERE iab__Release__c = :paramReleaseId
                WITH USER_MODE
                ORDER BY LastModifiedDate DESC
            ];

        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Metadata Component Changes.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }
        
    }



    // *************************
    // PROJECTS
    // *************************

    // getProjectId()
    // returns a Project recordId based on a record Id from a related Project, Release, or Story
    // used by: imhotepProjectResourcesBar and imhotepStoryChanges LWCs
    @AuraEnabled(cacheable=true)
    public static String getProjectId(Id paramRecordId) {
        // Check if the user has read access to the Release and Story custom objects
        if (Schema.sObjectType.iab__Release__c.isAccessible() && Schema.sObjectType.iab__Story__c.isAccessible()) {
            
            // create a variable to store the related Project__c record Id
            String projectId;

            // determine which object your record is from
            String objectName = paramRecordId.getSObjectType().getDescribe().getName();

            // for each, use switch statement to sort into separate lists by status
            switch on objectName {
                when 'iab__Release__c' {
                    // get the related Project recordId from a Release record
                    iab__Release__c release =
                        [
                            SELECT Id,iab__Project__c
                            FROM iab__Release__c
                            WHERE Id = :paramRecordId
                            WITH USER_MODE
                        ];

                    // and set the projectId variable
                    projectId = release.iab__Project__c;
                }
                when 'iab__Story__c' {
                    // get the related Project recordId from a Story record
                    iab__Story__c story =
                        [
                            SELECT Id,iab__Release__r.iab__Project__c
                            FROM iab__Story__c
                            WHERE Id = :paramRecordId
                            WITH USER_MODE
                        ];

                    // and set the projectId variable
                    projectId = story.iab__Release__r.iab__Project__c;
                }
                when else {
                    // set the projectId variable
                    projectId = paramRecordId;
                }
            }

            // return the string
            return projectId;

        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Releases and Stories.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }

    }


    
    // *************************
    // PROJECT MEMBERS
    // *************************

    // getProjectsByMembership()
    // queries for a user's project member records and returns the related project data
    // used by: devProjectTiles component
    @AuraEnabled
    public static List<List<iab__Project_Member__c>> getProjectsByMembership(Id ParamUserId) {

        // Check if the user has read access to iab__Project_Member__c
        if (Schema.sObjectType.iab__Project_Member__c.isAccessible()) {
            
            // declare a list variable for the master list of all projects
            List<List<iab__Project_Member__c>> allProjects = new List<List<iab__Project_Member__c>>();
                    
            // declare list variables for all sublists of signups
            List<iab__Project_Member__c> planningProjects = new List<iab__Project_Member__c>();
            List<iab__Project_Member__c> activeProjects = new List<iab__Project_Member__c>();
            List<iab__Project_Member__c> completedProjects = new List<iab__Project_Member__c>();

            // query project members
            for(iab__Project_Member__c aProjectMember :
                [
                    SELECT Id,iab__Project__c,iab__Project__r.Name,iab__Project__r.iab__Description__c,iab__Project__r.OwnerId,iab__Project__r.iab__Release_Count__c,iab__Project__r.iab__Status__c,iab__Project__r.iab__Type__c
                    FROM iab__Project_Member__c
                    WHERE iab__User__c = :ParamUserId
                    WITH USER_MODE
                    ORDER BY iab__Project__r.Name ASC
                ]) {
                    // for each, use switch statement to sort into separate lists by status
                    switch on aProjectMember.iab__Project__r.iab__Status__c {
                        when 'Planning' { planningProjects.add(aProjectMember); }
                        when 'Active' { activeProjects.add(aProjectMember); }
                        when 'Completed' { completedProjects.add(aProjectMember); }
                    }                      
                }

            // add each sublist to the list of lists
            allProjects.add(planningProjects);
            allProjects.add(activeProjects);
            allProjects.add(completedProjects);

            // return list of lists
            return allProjects;

        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Project Members.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }
        
    }
    
    
    
    // getProjectMembers()
    // queries all project members records for a given project
    // used by: devProjectMembers component
    @AuraEnabled
    public static List<iab__Project_Member__c> getProjectMembers(Id ParamProjectId) {

        // Check if the user has read access to iab__Project_Member__c
        if (Schema.sObjectType.iab__Project_Member__c.isAccessible()) {
            
            // declare a list variable for the master list of all projects
            List<iab__Project_Member__c> allProjectMembers =
                [
                    SELECT Id,iab__Notes__c,iab__Role__c,iab__User__c,iab__User__r.FirstName,iab__User__r.LastName
                    FROM iab__Project_Member__c
                    WHERE iab__Project__c = :ParamProjectID
                    WITH USER_MODE
                    ORDER BY iab__User__r.FirstName ASC
                ];

            // return list of lists
            return allProjectMembers;

        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Project Members.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }
        
    }
    
    
    
    // *************************
    // RELEASES
    // *************************

    // getAllReleases()
    // Returns all release records for a given project status value
    // used by: devProjectTiles component
    @AuraEnabled
    public static List<iab__Release__c> getAllReleases(String ParamReleaseStatus,Boolean ParamIsBacklog){

        // Check if the user has read access to iab__Release__c
        if (Schema.sObjectType.iab__Release__c.isAccessible()) {

            if(ParamIsBacklog) {
                return
                    [
                        SELECT Id,iab__Is_Backlog__c,Name,iab__Notes__c,iab__Project__c,iab__Release_Date__c,iab__Status__c
                        FROM iab__Release__c
                        WHERE iab__Is_Backlog__c = true
                        WITH USER_MODE
                        ORDER BY Name ASC
                    ];
            }
            else {
                if(ParamReleaseStatus == 'Accepted') {
                    return
                        [
                            SELECT Id,iab__Is_Backlog__c,Name,iab__Notes__c,iab__Project__c,iab__Release_Date__c,iab__Status__c
                            FROM iab__Release__c
                            WHERE iab__Status__c = :ParamReleaseStatus
                            AND iab__Is_Backlog__c = false
                            WITH USER_MODE
                            ORDER BY iab__Release_Date__c DESC
                        ];
                }
                else {
                    return
                        [
                            SELECT Id,iab__Is_Backlog__c,Name,iab__Notes__c,iab__Project__c,iab__Release_Date__c,iab__Status__c
                            FROM iab__Release__c
                            WHERE iab__Status__c = :ParamReleaseStatus
                            AND iab__Is_Backlog__c = false
                            WITH USER_MODE
                            ORDER BY Name ASC
                        ];
                }
            }

        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Releases.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }
        
    }
    
    
    
    // getReleaseLists()
    // queries all release records for a given project and splits them into separate lists for the backlog and each release status value
    // used by: devProjectReleases component
    @AuraEnabled
    public static List<List<iab__Release__c>> getReleaseLists(Id ParamProjectId) {

        // Check if the user has read access to iab__Release__c
        if (Schema.sObjectType.iab__Release__c.isAccessible()) {

            // declare a list variable for the master list of all projects
            List<List<iab__Release__c>> allReleases = new List<List<iab__Release__c>>();
                    
            // declare list variables for all sublists of releases
            List<iab__Release__c> planningReleases = new List<iab__Release__c>();
            List<iab__Release__c> activeReleases = new List<iab__Release__c>();
            List<iab__Release__c> acceptedReleases = new List<iab__Release__c>();
            List<iab__Release__c> backlogReleases = new List<iab__Release__c>();

            // query and fill the master list
            for(iab__Release__c rel : [
                SELECT Id,iab__Is_Backlog__c,Name,iab__Notes__c,iab__Project__c,iab__Release_Date__c,iab__Status__c
                FROM iab__Release__c
                WHERE iab__Project__c = :ParamProjectId
                WITH USER_MODE
                ORDER BY Name ASC
            ]) {
                // for each
                if(rel.iab__Is_Backlog__c == TRUE) {
                    backlogReleases.add(rel);
                }
                else {
                    // for non-backlog releases, use switch statement to sort into separate lists by status
                    switch on rel.iab__Status__c {
                        when 'Planning' { planningReleases.add(rel); }
                        when 'Active' { activeReleases.add(rel); }
                        when 'Accepted' { acceptedReleases.add(rel); }
                    }
                }
            }

            // add each sublist to the list of lists
            allReleases.add(planningReleases);
            allReleases.add(activeReleases);
            allReleases.add(acceptedReleases);
            allReleases.add(backlogReleases);

            // return list of lists
            return allReleases;

        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Releases.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }
        
    }


    
    // *************************
    // RESOURCE LINKS (was Project Resources)
    // *************************

    // getResourceLinks() <= was getProjectResources()
    // queries for Resource Link records based on a record Id from a related Project, Release, or Story
    // used by: imhotepResourceBar LWC component
    @AuraEnabled(cacheable=true)
    public static List<iab__Resource_Link__c> getResourceLinks(Id paramRecordId) {

        // Check if the user has read access to iab__Resource_Link__c, iab__Release__c, and iab__Story__c
        if (Schema.sObjectType.iab__Resource_Link__c.isAccessible() && Schema.sObjectType.iab__Release__c.isAccessible() && Schema.sObjectType.iab__Story__c.isAccessible()) {

            // set the related Project__c record Id as a variable
            String projectId;

            // determine which object your record is from
            String objectName = paramRecordId.getSObjectType().getDescribe().getName();

            // for each, use switch statement to sort into separate lists by status
            switch on objectName {
                when 'iab__Release__c' {
                    // get the related Project recordId from a Release record
                    iab__Release__c release =
                        [
                            SELECT Id,iab__Project__c
                            FROM iab__Release__c
                            WHERE Id = :paramRecordId
                            WITH USER_MODE
                        ];

                    // and set the projectId variable
                    projectId = release.iab__Project__c;
                }
                when 'iab__Story__c' {
                    // get the related Project recordId from a Story record
                    iab__Story__c story =
                        [
                            SELECT Id,iab__Release__r.iab__Project__c
                            FROM iab__Story__c
                            WHERE Id = :paramRecordId
                            WITH USER_MODE
                        ];

                    // and set the projectId variable
                    projectId = story.iab__Release__r.iab__Project__c;
                }
                when else {
                    // set the projectId variable
                    projectId = paramRecordId;
                }
            }

            // declare a list variable and query for all project resources
            List<iab__Resource_Link__c> allProjectResources =
                [
                    SELECT Id,Name,iab__URL__c,iab__Type__c
                    FROM iab__Resource_Link__c
                    WHERE iab__Project__c = :projectId
                    WITH USER_MODE
                    ORDER BY Name ASC
                ];

            // return the list
            return allProjectResources;

        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Releases, Resource Links, and Stories.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }

    }
    
    
    
    // *************************
    // STORIES
    // *************************

    // getStoriesByRelease()
    // return a Release's iab__Story__c records as a single list, ordered by Priority/Order ascending
    // used by: imhotepStoryList LWC
    @AuraEnabled(cacheable=true)
    public static List<iab__Story__c> getStoriesByRelease(Id ParamReleaseId) {
        // Check if the user has read access to iab__Story__c
        if (Schema.sObjectType.iab__Story__c.isAccessible()) {

            // declare a list variable for all stories
            List<iab__Story__c> releaseStories =
                [
                    SELECT Id, Name, iab__Actual_Points__c, iab__Expedite__c, iab__Estimated_Points__c, iab__Priority_Order__c, iab__Status__c, iab__Story_Number__c, iab__Story_Type__c, LastModifiedDate, iab__Assigned_Name__c, iab__Assigned__c, iab__Story_Description__c
                    FROM iab__Story__c
                    WHERE iab__Release__c =: ParamReleaseId
                    WITH USER_MODE
                    ORDER BY iab__Priority_Order__c ASC
                ];

            return releaseStories;

        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Stories.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }

    }

    
    
    // getStoriesByStatus()
    // return a Release's iab__Story__c records as a list of lists by status
    // used by: devKanbanRelease component
    @AuraEnabled
    public static List<List<iab__Story__c>> getStoriesByStatus(Id ParamReleaseId) {
        // Check if the user has read access to iab__Story__c
        if (Schema.sObjectType.iab__Story__c.isAccessible()) {

            // declare a list variable for the master list of all stories
            List<List<iab__Story__c>> allStories = new List<List<iab__Story__c>>();
                    
            // declare list variables for all sublists of stories
            List<iab__Story__c> blockedStories = new List<iab__Story__c>();
            List<iab__Story__c> definedStories = new List<iab__Story__c>();
            List<iab__Story__c> buildingStories = new List<iab__Story__c>();
            List<iab__Story__c> testingStories = new List<iab__Story__c>();
            List<iab__Story__c> readyStories = new List<iab__Story__c>();
            List<iab__Story__c> deployedStories = new List<iab__Story__c>();

            // query stories
            for(iab__Story__c aStory : [
                SELECT Name,iab__Actual_Points__c,iab__Expedite__c,iab__Estimated_Points__c,Id,iab__Priority_Order__c,iab__Status__c,iab__Story_Number__c,iab__Story_Type__c,iab__Assigned__c,iab__Assigned__r.iab__User__r.FirstName,iab__Assigned__r.iab__User__r.LastName
                FROM iab__Story__c
                WHERE iab__Release__c = :ParamReleaseId
                WITH USER_MODE
                ORDER BY iab__Priority_Order__c ASC
            ]) {
                // for each, use switch statement to sort into separate lists by status
                switch on aStory.iab__Status__c {
                    when 'Blocked' { blockedStories.add(aStory); }
                    when 'Defined' { definedStories.add(aStory); }
                    when 'Building' { buildingStories.add(aStory); }
                    when 'Testing' { testingStories.add(aStory); }
                    when 'Ready' { readyStories.add(aStory); }
                    when 'Deployed' { deployedStories.add(aStory); }
                }
            }

            // add each sublist to the list of lists
            allStories.add(blockedStories);
            allStories.add(definedStories);
            allStories.add(buildingStories);
            allStories.add(testingStories);
            allStories.add(readyStories);
            allStories.add(deployedStories);

            // return list of lists
            return allStories;

        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Stories.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }
        
    }

    
    
    // moveStory()
    // Updates the status of a iab__Story__c based on what Kanban column it was dragged into
    // used by: devKanbanRelease component
    @AuraEnabled
    public static iab__Story__c moveStory(String ParamStoryId, String ParamNewStatus) {

        // Check if the user has read access to iab__Story__c and update access to the iab__Status__c field
        if (Schema.sObjectType.iab__Story__c.isAccessible() && Schema.sObjectType.iab__Story__c.fields.iab__Status__c.isUpdateable()) {

            // get the story record
            iab__Story__c story =
                [
                    SELECT Id,iab__Status__c
                    FROM iab__Story__c
                    WHERE Id = :ParamStoryId
                    WITH USER_MODE
                    LIMIT 1
                ];
            
            // update the status value
            story.iab__Status__c = ParamNewStatus;
                    
            update story;

            return story;

        } else {
            // Handle the case where the user does not have read and update access
            
            // Log the custom message
            System.debug('Insufficient permissions to read and update Stories.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }

    }

    
    
    // saveReorderedStories()
    // Updates the Priority_Order__c field values for multiple iab__Story__c records
    // used by: imhotepStoryList LWC
    @AuraEnabled
    public static Integer saveReorderedStories (Map<Id, Decimal> orderedMap) {
        
        // Check if the user has read access to iab__sobject__c
        if (Schema.sObjectType.iab__Story__c.isAccessible() && Schema.sObjectType.iab__Story__c.fields.iab__Priority_Order__c.isUpdateable()) {

            // check if the map is blank
            if (orderedMap.isEmpty()) {
                throw new IllegalArgumentException('Input map is empty');
            }

            Set<Id> consolidatedIdSet = new Set<Id>();

            // Validate Ids and Decimal values in the map
            for (Id key : orderedMap.keySet()) {
                try {
                    Id recordId = Id.valueOf(key);
                    if (recordId.getSObjectType() != iab__Story__c.sObjectType) {
                        throw new IllegalArgumentException('Unexpected SObject for Id: ' + key);
                    }
                    Object recordValue = orderedMap.get(key);
                    if (!(recordValue instanceof Decimal)) {
                        throw new IllegalArgumentException('Invalid value data type for Id: ' + key);
                    }
                    Decimal orderValue = (Decimal) recordValue;
                    consolidatedIdSet.add(key);
                } catch (Exception e) {
                    throw new IllegalArgumentException('Invalid Id or value: ' + key);
                }
            }

            // Ensure we have valid Ids to query
            if (consolidatedIdSet.isEmpty()) {
                throw new IllegalArgumentException('No valid Ids found in input');
            }

            // Use bind variables safely in the SOQL query
            List<iab__Story__c> stories = [
                SELECT Id, iab__Priority_Order__c
                FROM iab__Story__c
                WHERE Id IN :consolidatedIdSet
                WITH USER_MODE
                FOR UPDATE
            ];

            // update iab__Priority_Order__c field for each iab__Story__c in the map
            for (iab__Story__c story : stories) {
                story.iab__Priority_Order__c = orderedMap.get(story.Id);
            }
            update stories;

            return stories.size();

        } else {
            // Handle the case where the user does not have read and update access
            
            // Log the custom message
            System.debug('Insufficient permissions to read and update Stories.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }
        
    }
    
    
    
    // *************************
    // TAGS
    // *************************

    // getActiveProjectTagRecords()
    // Returns all iab__Tag__c records related to given iab__Project__c record
    // used by: devProjectTags component
    @AuraEnabled
    public static List<iab__Tag__c> getActiveProjectTagRecords(String ParamProjectId){
        // Check if the user has read access to iab__Tag__c
        if (Schema.sObjectType.iab__Tag__c.isAccessible()) {

            return [
                SELECT Id,Name
                FROM iab__Tag__c
                WHERE iab__Project__c =: ParamProjectId
                AND iab__Is_Active__c = TRUE
                WITH USER_MODE
                ORDER BY Name ASC
            ];
            
        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Tags.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }

    }
    
    
    
    // *************************
    // TAG ASSIGNMENTS
    // *************************

    // getStoryTagAssignmentRecords()
    // Returns all iab__Tag_Assignment__c records related to the current story
    // used by: devStoryTags component
    @AuraEnabled
    public static List<iab__Tag_Assignment__c> getStoryTagAssignmentRecords(Id ParamStoryId){
        // Check if the user has read access to iab__Tag_Assignment__c
        if (Schema.sObjectType.iab__Tag_Assignment__c.isAccessible()) {
            
            return [
                SELECT Id,iab__Tag__r.Name,iab__Tag__r.Id
                FROM iab__Tag_Assignment__c
                WHERE iab__Story__c =: ParamStoryId
                WITH USER_MODE
                ORDER BY iab__Tag__r.Name ASC
            ];

        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Tag Assignments.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }

    }



    // getTagAssignmentRecords()
    // Returns all iab__Story__c records for a given iab__Tag__c
    // Acceptable values for ParamReleaseFilter:  Active Release, Planning Release, Backlog, Accepted Release, All
    // used by: devTagStories
    @AuraEnabled
    public static List<iab__Tag_Assignment__c> getTagAssignmentRecords(Id ParamTagId, String ParamReleaseFilter){
        // Check if the user has read access to iab__Tag_Assignment__c, iab__Release__c, and iab__Story__c
        if (Schema.sObjectType.iab__Tag_Assignment__c.isAccessible() && Schema.sObjectType.iab__Release__c.isAccessible() && Schema.sObjectType.iab__Story__c.isAccessible()) {

            if(ParamReleaseFilter == 'All') {
                // return all Tag Assignments
                return [
                    SELECT Id,iab__Story__r.iab__Assigned__c,iab__Story__r.iab__Assigned__r.iab__User__r.FirstName,iab__Story__r.iab__Assigned__r.iab__User__r.LastName,iab__Story__c,iab__Story__r.Name,iab__Story__r.iab__Status__c,iab__Story__r.iab__Story_Number__c,iab__Story__r.iab__Priority_Order__c,iab__Story__r.iab__Estimated_Points__c,iab__Story__r.iab__Actual_Points__c,iab__Story__r.iab__Release__r.Name,iab__Story__r.iab__Release__c
                    FROM iab__Tag_Assignment__c
                    WHERE iab__Tag__c = :ParamTagId
                    WITH USER_MODE
                    ORDER BY Name ASC
                ];
            }
            else {
                // return filtered list of Dev Theme Assignments based on the iab__Release_Category__c field
                return [
                    SELECT Id,iab__Story__r.iab__Assigned__c,iab__Story__r.iab__Assigned__r.iab__User__r.FirstName,iab__Story__r.iab__Assigned__r.iab__User__r.LastName,iab__Story__c,iab__Story__r.Name,iab__Story__r.iab__Status__c,iab__Story__r.iab__Story_Number__c,iab__Story__r.iab__Priority_Order__c,iab__Story__r.iab__Estimated_Points__c,iab__Story__r.iab__Actual_Points__c,iab__Story__r.iab__Release__r.Name,iab__Story__r.iab__Release__c
                    FROM iab__Tag_Assignment__c
                    WHERE iab__Tag__c = :ParamTagId
                    AND iab__Release_Category__c = :ParamReleaseFilter
                    WITH USER_MODE
                    ORDER BY Name ASC
                ];
            }
            
        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Tag Assignments, Releases, and Stories.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }

    }


    
    // *************************
    // TEMPLATES
    // *************************

    // getTemplatesByType()
    // Returns all iab__Template__c records accessible for the current user, divided by type into separate lists
    // used by: devTemplateSelectionTable
    @AuraEnabled
    public static List<List<iab__Template__c>> getTemplatesByType() {
        // Check if the user has read access to iab__Template__c
        if (Schema.sObjectType.iab__Template__c.isAccessible()) {
            
            // declare a list variable for the master list of all templates
            List<List<iab__Template__c>> allTemplates = new List<List<iab__Template__c>>();
                    
            // query templates and build lists

            // return Templates (Mine)
            List<iab__Template__c> myTemplates =
                [
                    SELECT Id,Name,iab__Access__c,iab__Current_User_is_Owner__c,iab__Description__c,iab__Estimated_Points_Beginner__c,iab__Estimated_Points_Expert__c,iab__Estimated_Points_Intermediate__c,iab__Item_Count__c,OwnerId,Owner.FirstName,Owner.LastName,iab__Standard_Template__c
                    FROM iab__Template__c
                    WHERE iab__Standard_Template__c = false AND iab__Current_User_is_Owner__c = true
                    WITH USER_MODE
                    ORDER BY Name ASC
                ];

            // return Templates (Standard)
            List<iab__Template__c> standardTemplates =
                [
                    SELECT Id,Name,iab__Access__c,iab__Current_User_is_Owner__c,iab__Description__c,iab__Estimated_Points_Beginner__c,iab__Estimated_Points_Expert__c,iab__Estimated_Points_Intermediate__c,iab__Item_Count__c,OwnerId,Owner.FirstName,Owner.LastName,iab__Standard_Template__c
                    FROM iab__Template__c
                    WHERE iab__Standard_Template__c = true
                    WITH USER_MODE
                    ORDER BY Name ASC
                ];

            // return Templates (Shared)
            List<iab__Template__c> sharedTemplates =
                [
                    SELECT Id,Name,iab__Access__c,iab__Current_User_is_Owner__c,iab__Description__c,iab__Estimated_Points_Beginner__c,iab__Estimated_Points_Expert__c,iab__Estimated_Points_Intermediate__c,iab__Item_Count__c,OwnerId,Owner.FirstName,Owner.LastName,iab__Standard_Template__c
                    FROM iab__Template__c
                    WHERE iab__Current_User_is_Owner__c = false
                    AND iab__Access__c = 'Public'
                    WITH USER_MODE
                    ORDER BY Name ASC
                ];

            // add each sublist to the list of lists
            allTemplates.add(myTemplates);
            allTemplates.add(standardTemplates);
            allTemplates.add(sharedTemplates);

            // return list of lists
            return allTemplates;

        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Templates.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }

    }


    
    // *************************
    // TEMPLATE ITEMS
    // *************************
    
    // getTemplateItemsForType()
    // Returns all iab__Template_Item__c records for a given type
    // Acceptable values for ParamTemplateType: Mine, Standard, and Shared
    // used by: devTemplateSelectionTable component
    @AuraEnabled
    public static List<iab__Template_Item__c> getTemplateItemsForType(String ParamTemplateType){
        // Check if the user has read access to iab__Template__c and iab__Template_Item__c
        if (Schema.sObjectType.iab__Template__c.isAccessible() &&
            Schema.sObjectType.iab__Template_Item__c.isAccessible()) {

            // return Templates (Mine)
            if(ParamTemplateType == 'Mine') {
                return [
                    SELECT Id,Name,iab__Estimated_Points_Beginner__c,iab__Estimated_Points_Expert__c,iab__Estimated_Points_Intermediate__c,iab__Priority_Order__c,iab__Template__c
                    FROM iab__Template_Item__c
                    WHERE iab__Template__r.iab__Standard_Template__c = false AND iab__Template__r.iab__Current_User_is_Owner__c = true
                    WITH USER_MODE
                    ORDER BY iab__Priority_Order__c ASC
                ];
            }

            // return Templates (Shared)
            else if(ParamTemplateType == 'Shared') {
                return [
                    SELECT Id,Name,iab__Estimated_Points_Beginner__c,iab__Estimated_Points_Expert__c,iab__Estimated_Points_Intermediate__c,iab__Priority_Order__c,iab__Template__c
                    FROM iab__Template_Item__c
                    WHERE iab__Template__r.iab__Current_User_is_Owner__c = false
                    AND iab__Template__r.iab__Access__c = 'Public'
                    WITH USER_MODE
                    ORDER BY iab__Priority_Order__c ASC
                ];
            }

            // return Templates (Standard)
            else {
                return [
                    SELECT Id,Name,iab__Estimated_Points_Beginner__c,iab__Estimated_Points_Expert__c,iab__Estimated_Points_Intermediate__c,iab__Priority_Order__c,iab__Template__c
                    FROM iab__Template_Item__c
                    WHERE iab__Template__r.iab__Standard_Template__c = true
                    WITH USER_MODE
                    ORDER BY iab__Priority_Order__c ASC
                ];
            }

        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Templates and Template Items.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }

    }
    

    
    // *************************
    // TEST SCENARIOS (was Test Cases)
    // *************************

    // getTestScenariosWithTestResults()
    // get all iab__Test_Scenario__c records (and their iab__Test_Result__c records) related to a specific iab__Story__c
    // used by: devStoryTestScenarios component
    @AuraEnabled
    public static List<iab__Test_Scenario__c> getTestScenariosWithTestResults(Id ParamStoryId){
        // Check if the user has read access to iab__Test_Scenario__c, iab__Test_Result__c, and iab__Story__c
        if (Schema.sObjectType.iab__Test_Scenario__c.isAccessible() && Schema.sObjectType.iab__Test_Result__c.isAccessible() && Schema.sObjectType.iab__Story__c.isAccessible()) {

            return [
                SELECT Id,CreatedById,CreatedBy.FirstName,CreatedBy.LastName,iab__Description__c,iab__Expected_Result__c,iab__Instructions__c,LastModifiedById,LastModifiedBy.FirstName,LastModifiedBy.LastName,Name,iab__Status__c,
                    (SELECT Id,Name,iab__Builder_Notes__c,iab__Result__c,iab__Status__c,iab__Tester__c,iab__Tester__r.User__r.FirstName,iab__Tester__r.User__r.LastName,iab__Tester_Feedback__c,LastModifiedDate
                    FROM iab__Test_Results__r
                    ORDER BY Name Asc)
                FROM iab__Test_Scenario__c
                WHERE iab__Story__c = :ParamStoryId
                WITH USER_MODE
                ORDER BY CreatedDate ASC
            ];

        } else {
            // Handle the case where the user does not have read access
            
            // Log the custom message
            System.debug('Insufficient permissions to read Test Scenarios and Test Results.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }
        
    }



    // *************************
    // USER RECORD ACCESS
    // *************************

    // checkUserEditAccess()
    // Checks to see if current user has read/write on a Release record
    // used by: devKanbanRelease (Aura) and imhotepStoryList (LWC) components
    @AuraEnabled(cacheable=true)
    public static Boolean checkUserEditAccess(Id ParamReleaseId, Id ParamUserId) {
        Boolean hasEditAccess = false;
        
        // Check if the user has read access to UserRecordAccess
        if (Schema.sObjectType.UserRecordAccess.isAccessible()) {
            
            UserRecordAccess a =
                [
                    SELECT RecordId, HasReadAccess, HasEditAccess, MaxAccessLevel
                    FROM UserRecordAccess
                    WHERE RecordId = :ParamReleaseId
                    AND UserId = :ParamUserId
                ];

            if(a.HasEditAccess) {
                hasEditAccess = true;
            }

            return hasEditAccess;

        } else {
            // Handle the case where the user does not read access
            
            // Log the custom message
            System.debug('Insufficient permissions for determining edit access to the Release.');
            
            // Throw NoAccessException
            throw new System.NoAccessException();
        }
        
    }
    


}