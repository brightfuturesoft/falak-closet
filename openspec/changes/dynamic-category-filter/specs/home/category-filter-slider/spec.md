## Purpose

This capability provides users with dynamic category and product attribute filters on the home page, pulling live categories, occasions, materials, and weather attributes from the database and rendering them in an interactive carousel slider.

## ADDED Requirements

### Requirement: Dynamic Filter Data Retrieval
The system SHALL retrieve all active categories and unique product attributes from the database via a public JSON API endpoint.

#### Scenario: Successful Filter Options Fetch
- **WHEN** a client sends a GET request to `/api/home/filters`
- **THEN** the system queries the database and returns a list of categories (with their active product counts) and unique lists of product attributes (occasions, materials, and weather) with an HTTP 200 status code.

### Requirement: Dynamic Rendering of Filter Slider
The homepage category filter slider component MUST dynamically fetch the filter options from `/api/home/filters` and render four interactive filter cards (Occasion, Weather, Material, Category) with the retrieved tags.

#### Scenario: Render Interactive Cards and Filter Tags
- **WHEN** the user visits the home page and the filter component mounts
- **THEN** the component fetches the data from `/api/home/filters` and renders cards for Occasion, Weather, Material, and Category populated with their respective dynamic tags.

### Requirement: Interactive Product Filtering on Home Page
Clicking a tag in the category filter slider SHALL update the home page active filter state and dynamically filter the displayed products list.

#### Scenario: Filter Products by Occasion on Home Page
- **WHEN** the user clicks the "Party Wear" occasion tag in the slider
- **THEN** the active filter banner is displayed, and the product sections on the homepage are updated to only display products matching the "Party Wear" occasion.
