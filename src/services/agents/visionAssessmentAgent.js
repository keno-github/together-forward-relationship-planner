/**
 * Vision Assessment Agent - Luna's intelligent compatibility assessment
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
});

console.log('Vision Assessment Agent loaded');

export default {};
