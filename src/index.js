// src/index.js
import set from 'lodash.set';

export class MagentoMapper {
    constructor(mapping) {
        this.mapping = mapping;
    }

    /**
     * Transforms a source ERP object into a Magento product payload.
     * @param {object} sourceObject - The raw product data from the ERP.
     * @returns {Promise<object>} The fully formed Magento product payload.
     */
    async transform(sourceObject) {
        const magentoPayload = {
            product: {
                custom_attributes: [],
            },
        };

        const sections = ['core', 'extensionAttributes', 'customAttributes'];
        const promises = [];

        for (const section of sections) {
            for (const [magentoPath, sourceInstruction] of Object.entries(this.mapping[section] || {})) {

                const promise = (async () => {
                    let value;
                    if (typeof sourceInstruction === 'function') {
                        value = await sourceInstruction(sourceObject);
                    } else {
                        value = sourceObject[sourceInstruction];
                    }

                    if (value === null || typeof value === 'undefined') {
                        return;
                    }

                    if (section === 'customAttributes') {
                        magentoPayload.product.custom_attributes.push({
                            attribute_code: magentoPath,
                            value: value,
                        });
                    } else {
                        const destinationPath = `product.${section === 'extensionAttributes' ? 'extension_attributes.' : ''}${magentoPath}`;
                        set(magentoPayload, destinationPath, value); // <-- Using the imported function
                    }
                })();

                promises.push(promise);
            }
        }

        await Promise.all(promises);

        if (!magentoPayload.product.sku) {
            throw new Error('Mapping failed to generate a SKU for the product.');
        }

        return magentoPayload;
    }
}

/**
 * Factory function to create a new mapper instance.
 * @param {object} mappingConfig - The mapping configuration object.
 * @returns {MagentoMapper}
 */
export function createMapper(mappingConfig) {
    return new MagentoMapper(mappingConfig);
}