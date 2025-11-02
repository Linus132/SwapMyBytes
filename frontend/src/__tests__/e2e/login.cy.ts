
/// <reference types="cypress" />

describe('Login Test', () => {

    beforeEach(() => {
        const port = Cypress.env('SMB_FRONTEND_PORT_EXTERNAL');
        cy.visit(`http://127.0.0.1:${port}/login`); 
    });

    it('should display validation errors for empty inputs', () => {
        cy.get('button[type="submit"]').click();
        cy.contains('Username is required.').should('be.visible');
        cy.contains('Password is required.').should('be.visible');
    });

    it('should log in successfully with correct credentials', () => {
        
        cy.get('#username').type('smb1');
        cy.get('#password').type('testuserpassword123!');
        cy.get('button[type="submit"]').click();

        cy.url().should('eq', 'http://127.0.0.1:5080/'); 
    });

    it('should show error message on invalid credentials', () => {
        cy.get('#username').type('wrongUser');
        cy.get('#password').type('wrongPassword');
        cy.get('button[type="submit"]').click();
        
        cy.contains('AuthenticationError').should('be.visible');
    });
});