# ERP to Magento Mapper

[![npm version](https://badge.fury.io/js/%40your-username%2Ferp-to-magento-mapper.svg)](https://badge.fury.io/js/%40your-username%2Ferp-to-magento-mapper)

A declarative, flexible, and powerful engine to transform data objects from any source (like an ERP) into a fully-formed Magento 2 product payload, ready for the REST API.

This package is designed to separate your business mapping logic from the transformation engine, making your integration code cleaner, more maintainable, and easier to test. It fully supports simple mappings, complex transformations, static values, and even asynchronous lookups for things like fetching Magento attribute option IDs from a database.

## Key Features

- **Declarative Mapping**: Define your complex transformation rules in a simple, readable configuration file.
- **Asynchronous Support**: Easily handle `async/await` operations within your mapping for database lookups or other API calls.
- **Nested Path Support**: Maps directly to Magento's nested structures like `extension_attributes.stock_item` and `custom_attributes`.
- **Lightweight & Dependency-Free**: Has only one tiny dependency (`lodash.set`) for utility.
- **Clean & Maintainable**: Decouples mapping logic from your core application flow, making changes trivial.

## Installation

```bash
npm install @tony-tang/erp-to-magento-mapper
```

## Quick Start

The core idea is to create a mapping configuration file and then use the `createMapper` to process your source data.

### 1. Create Your Mapping Configuration

This file defines how your source ERP data maps to Magento's product structure.

`erp-magento-mapping.js`:
```javascript
/**
 * Defines the mapping from an ERP source object to the Magento product payload.
 *
 * @param {object} deps - Optional dependencies for transformations (e.g., a DB client).
 */
const createMapping = (deps) => ({
  // Maps to top-level Magento product attributes
  core: {
    'sku': 'productId',             // Direct 1-to-1 mapping
    'name': 'description_1',
    'price': 'sales_price_3',
    'status': () => 1,              // Static value
    'visibility': () => 4,
  },

  // Maps to extension_attributes
  extensionAttributes: {
    'stock_item.qty': 'inventory',
    'stock_item.is_in_stock': (source) => source.inventory > 0, // Transformation function
  },

  // Maps to the custom_attributes array
  customAttributes: {
    'description': 'description_2',
    'rrp': 'sales_price_4',

    // Asynchronous transformation for lookups
    'brand': async (source) => {
      if (!source.class_2) return null;
      // const optionId = await lookupBrandId(source.class_2, deps.dbClient);
      // return optionId;
      const brandMap = { 'Nike': '124', 'Adidas': '125' };
      return brandMap[source.class_2] || null;
    },
  },
});

export default createMapping;
```

### 2. Use the Mapper in Your Application

In your integration logic (e.g., an AWS Lambda function), import and use the mapper.

`importer.js`:
```javascript
import { createMapper } from '@your-username/erp-to-magento-mapper';
import createMapping from './erp-magento-mapping.js';

// Example ERP product data
const erpProduct = {
  productId: 'NK-SHOE-RED-10',
  description_1: 'Awesome Running Shoe',
  description_2: 'The best running shoe for any terrain.',
  inventory: 50,
  sales_price_3: 99.99,
  sales_price_4: 129.99,
  class_2: 'Nike', // Brand
};

// 1. Initialize the mapper with your configuration
const mappingConfig = createMapping(/* pass dependencies here if any */);
const mapper = createMapper(mappingConfig);

// 2. Transform the data
async function transformProduct() {
  try {
    const magentoPayload = await mapper.transform(erpProduct);
    console.log(JSON.stringify(magentoPayload, null, 2));
    // Now send this payload to the Magento API...
  } catch (error) {
    console.error('Transformation failed:', error);
  }
}

transformProduct();
```

### Expected Output

The code above will generate the following Magento-ready payload:

```json
{
  "product": {
    "custom_attributes": [
      {
        "attribute_code": "description",
        "value": "The best running shoe for any terrain."
      },
      {
        "attribute_code": "rrp",
        "value": 129.99
      },
      {
        "attribute_code": "brand",
        "value": "124"
      }
    ],
    "sku": "NK-SHOE-RED-10",
    "name": "Awesome Running Shoe",
    "price": 99.99,
    "status": 1,
    "visibility": 4,
    "extension_attributes": {
      "stock_item": {
        "qty": 50,
        "is_in_stock": true
      }
    }
  }
}
```

## API

### `createMapper(mappingConfig)`

-   `mappingConfig` `<Object>`: The configuration object that defines the mapping rules.
-   Returns `<MagentoMapper>`: An instance of the mapper.

### `mapper.transform(sourceObject)`

-   `sourceObject` `<Object>`: The source data object to be transformed.
-   Returns `<Promise<Object>>`: A promise that resolves to the final Magento product payload.

The `sourceObject` is passed as an argument to any transformation functions defined in the mapping configuration.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/erp-to-magento-mapper/issues).

## License

This project is [MIT](./LICENSE) licensed.
