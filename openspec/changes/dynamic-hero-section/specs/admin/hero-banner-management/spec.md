## Purpose

Provides administrative interfaces and APIs to configure, retrieve, update, delete, and sort promotional hero banner slides dynamically, serving active banners to the store frontend.

## ADDED Requirements

### Requirement: Admin Slide Retrieval
The system SHALL provide an authenticated administrative interface and API to retrieve all configured hero slides, including both active and inactive banners, sorted by their display order.

#### Scenario: Retrieve all slides for administration
- **WHEN** an authenticated administrator requests the list of hero slides
- **THEN** the system returns a JSON list of all slides including their tag, title, subtitle, image, CTA text, CTA link, sort order, and active status

### Requirement: Admin Slide Creation and Modification
The system SHALL allow authenticated administrators to create new hero slides and modify existing ones with validation on required fields.

#### Scenario: Create a new hero slide successfully
- **WHEN** an authenticated administrator submits a slide with a valid tag, title, subtitle, image URL, CTA text, CTA link, and sort order
- **THEN** the system saves the new slide and returns the persisted slide record

#### Scenario: Update an existing hero slide
- **WHEN** an authenticated administrator updates fields of an existing slide with valid data
- **THEN** the system saves the updates in the database and returns the updated slide record

### Requirement: Admin Slide Deletion
The system SHALL allow authenticated administrators to delete hero slides from the database.

#### Scenario: Delete a slide
- **WHEN** an authenticated administrator requests the deletion of a specific slide ID
- **THEN** the system removes the slide record from the database and returns success

### Requirement: Public Slide Retrieval
The system SHALL expose a public API endpoint to serve only the active hero slides, sorted in ascending order of their sort order.

#### Scenario: Storefront requests hero slides
- **WHEN** the homepage hero carousel requests slides
- **THEN** the system returns a list of only active slides, sorted in ascending order by their display order
