## ADDED Requirements

### Requirement: Escort Applications Include Specialties
The system SHALL require users applying to become escorts to provide at least one service specialty/tag.

#### Scenario: Submit application with tags
- **WHEN** an authenticated user submits an escort profile application with a valid ID card number and one or more valid tags
- **THEN** the system creates a pending escort profile
- **AND** the submitted tags are stored on the escort profile
- **AND** the user's role is not promoted to `ESCORT`

#### Scenario: Reject application without tags
- **WHEN** an authenticated user submits an escort profile application without any valid tags
- **THEN** the system rejects the request with a validation error
- **AND** no escort profile is created

### Requirement: Admins Review Applicant Tags
The system SHALL show applicant-submitted tags to admins when they review pending escort profile applications.

#### Scenario: Pending list includes submitted tags
- **WHEN** an admin loads pending escort profile applications
- **THEN** each pending profile includes the tags submitted by the applicant

### Requirement: Admins Confirm Final Tags During Approval
The system SHALL require admins to confirm non-empty final tags before approving an escort profile application.

#### Scenario: Approve application with final tags
- **WHEN** an admin approves a pending escort profile application with one or more valid final tags
- **THEN** the system stores the final tags on the escort profile
- **AND** the system marks the profile as approved and verified
- **AND** the system promotes the user role to `ESCORT`

#### Scenario: Reject approval without final tags
- **WHEN** an admin attempts to approve a pending escort profile application without any valid final tags
- **THEN** the system rejects the approval request
- **AND** the profile remains pending
- **AND** the user role is not promoted to `ESCORT`

#### Scenario: Reject application without final tags
- **WHEN** an admin rejects a pending escort profile application
- **THEN** final tags are not required
- **AND** the system marks the profile as rejected
- **AND** the user role is not promoted to `ESCORT`

### Requirement: Public Escort Profiles Show Confirmed Tags
The system SHALL include confirmed tags in public escort profile results for approved and verified escorts.

#### Scenario: Public list includes confirmed tags
- **WHEN** a patient loads the public escort profile list
- **THEN** each approved and verified escort profile includes its confirmed tags
- **AND** sensitive fields such as ID card number are not returned

#### Scenario: Unapproved profile remains hidden
- **WHEN** a patient loads the public escort profile list
- **THEN** profiles that are not both approved and verified are not included
