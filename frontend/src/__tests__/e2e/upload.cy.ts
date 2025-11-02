import 'cypress-file-upload';

describe('Test for uploading a File', () => {

  beforeEach(() => {
    const port = Cypress.env('SMB_FRONTEND_PORT_EXTERNAL');
        cy.visit(`http://127.0.0.1:${port}/login`); 
        cy.get('#username').type('smb1');
        cy.get('#password').type('testuserpassword123!');
        cy.get('button[type="submit"]').click();
        cy.url().should('eq', 'http://127.0.0.1:5080/');
  });


  it('should display the file dropzone', () => {
    cy.get('[data-testid="dropzone"]').should('be.visible');
  });

  it('should allow a user to upload a file', () => {
    const fileName = 'testfile.txt';
    cy.fixture(fileName).then(fileContent => {
      cy.get('[data-testid="dropzone"]')
      .find('input[type="file"]')
      .attachFile({ fileContent, fileName, mimeType: 'text/plain' });
    });

    cy.get('button').contains('Upload').should('be.visible').click();

    cy.get('[data-testid="upload-progress"]').should('exist');

    cy.contains('Upload Complete!').should('be.visible');
  });

  it('should not show the upload button when no file is selected', () => {
    const fileName = 'testfile.txt';
    cy.fixture(fileName).then(fileContent => {
      cy.get('[data-testid="dropzone"]')
        .find('input[type="file"]')
        .attachFile({ fileContent, fileName, mimeType: 'text/plain' });
    });

    cy.get('button').contains('Upload').should('be.visible');

    cy.get('[data-testid="dropzone"]')
      .find('button[aria-label="Delete"]')
      .click();

    cy.get('button').contains('Upload').should('not.exist');
  });

  it('should show the download link after successful upload', () => {
    const fileName = 'testfile.txt';
    cy.fixture(fileName).then(fileContent => {
      cy.get('[data-testid="dropzone"]')
      .find('input[type="file"]')
      .attachFile({ fileContent, fileName, mimeType: 'text/plain' });
    });

    cy.get('button').contains('Upload').click();

    cy.contains('Upload successful! 🎉').should('be.visible');
    cy.get('button').contains('Download').should('be.visible');
  });
});