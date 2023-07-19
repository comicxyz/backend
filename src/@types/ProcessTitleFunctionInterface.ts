import SeriesInterface from './SeriesInterface';

interface ProcessTitleFunctionInterface {
  (url: string, category?: string): Promise<SeriesInterface>;
}
export default ProcessTitleFunctionInterface;
