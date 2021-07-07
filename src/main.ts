// Node imports.
import path from 'path';

// Library imports.
import express, { Express, NextFunction, Request, Response } from 'express';

// App imports.
import { serverInfo } from './ServerInfo';
import * as IMAP from './IMAP';
import * as SMTP from './SMTP';
import * as Contacts from './Contacts';
import { IContact } from './Contacts';

const app: Express = express();

app.use(express.json());

app.use('/', express.static(path.join(__dirname, '../../client/dist')));

// Enable CORS so that we can call the API even from anywhere.
app.use(function (
  inRequest: Request,
  inResponse: Response,
  inNext: NextFunction
) {
  inResponse.header('Access-Control-Allow-Origin', '*');
  inResponse.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  inResponse.header(
    'Access-Control-Allow-Headers',
    'Origin,X-Requested-With,Content-Type,Accept'
  );
  inNext();
});

app.get('/mailboxes', async (inRequest: Request, inResponse: Response) => {
  console.log('GET /mailboxes (1)');
  try {
    const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
    const mailboxes: IMAP.IMailbox[] = await imapWorker.listMailboxes();
    console.log('GET /mailboxes (1): Ok', mailboxes);
    inResponse.json(mailboxes);
  } catch (inError) {
    console.log('GET /mailboxes (1): Error', inError);
    inResponse.send('error');
  }
});

app.get(
  '/mailboxes/:mailbox',
  async (inRequest: Request, inResponse: Response) => {
    console.log('GET /mailboxes (2)', inRequest.params.mailbox);
    try {
      const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
      const messages: IMAP.IMessage[] = await imapWorker.listMessages({
        mailbox: inRequest.params.mailbox,
      });
      console.log('GET /messages (2): Ok', messages);
      inResponse.json(messages);
    } catch (inError) {
      console.log('GET /messages (2): Error', inError);
      inResponse.send('error');
    }
  }
);

app.get(
  '/messages/:mailbox/:id',
  async (inRequest: Request, inResponse: Response) => {
    console.log(
      'GET /mailboxes (3)',
      inRequest.params.mailbox,
      inRequest.params.mailbox.id
    );
    try {
      const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
      const messageBody: string = await imapWorker.getMessageBody({
        mailbox: inRequest.params.mailbox,
        id: parseInt(inRequest.params.id, 10),
      });
      console.log('GET /messages (3): Ok', messages);
      inResponse.send(messageBody);
    } catch (inError) {
      console.log('GET /messages (3): Error', inError);
      inResponse.send('error');
    }
  }
);

app.delete(
  '/messages/:mailbox/:id',
  async (inRequest: Request, inResponse: Response) => {
    console.log('DELETE /messages');
    try {
      const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
      await imapWorker.deleteMessage({
        mailbox: inRequest.params.mailbox,
        id: parseInt(inRequest.params.id, 10),
      });
      console.log('DELETE /messages: Ok');
      inResponse.send('ok');
    } catch (inError) {
      console.log('DELETE /messages: Error', inError);
      inResponse.send('error');
    }
  }
);

app.post('/messages', async (inRequest: Request, inResponse: Response) => {
  console.log('POST /messages', inRequest.body);
  try {
    const smtpWorker: SMTP.Worker = new SMTP.Worker(serverInfo);
    await smtpWorker.sendMessage(inRequest.body);
    console.log('POST /messages: Ok');
    inResponse.send('ok');
  } catch (inError) {
    console.log('POST /messages: Error', inError);
    inResponse.send('error');
  }
});

app.get('/contacts', async (inRequest: Request, inResponse: Response) => {
  console.log('GET /contacts');
  try {
    const contactsWorker: Contacts.Worker = new Contacts.Worker();
    const contacts: IContact[] = await contactsWorker.listContacts();
    console.log('GET /contacts: Ok', contacts);
    inResponse.json(contacts);
  } catch (inError) {
    console.log('GET /contacts: Error', inError);
    inResponse.send('error');
  }
});

app.post('/contacts', async (inRequest: Request, inResponse: Response) => {
  console.log('POST /contacts');
  try {
    const contactsWorker: Contacts.Worker = new Contacts.Worker();
    const contact: IContact = await contactsWorker.addContact(inRequest.body);
    inResponse.json(contact);
    console.log('POST /contacts: ok', contact);
  } catch (inError) {
    console.log('POST /contacts: Error', inError);
    inResponse.send('error');
  }
});
