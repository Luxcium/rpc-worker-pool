import { getBigStrPhashFromFile } from '@luxcium/phash-compute';

import { ProcessStepComposable } from '../core/classes/ProcessStepComposable';

getBigStrPhashFromFile;

const somevalue = ProcessStepComposable.of(getBigStrPhashFromFile);
void somevalue.compose(i => ({ bigString: async () => i }));
