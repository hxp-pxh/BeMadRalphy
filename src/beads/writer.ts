import { logInfo } from '../utils/logging.js';

export class BeadsWriter {
  async create(_title: string, _body: string): Promise<string> {
    logInfo('BeadsWriter.create not implemented yet');
    return 'bd-unknown';
  }

  async update(_id: string, _body: string): Promise<void> {
    logInfo('BeadsWriter.update not implemented yet');
  }

  async close(_id: string): Promise<void> {
    logInfo('BeadsWriter.close not implemented yet');
  }
}
