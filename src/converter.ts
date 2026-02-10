const TYPE_MAP: Record<string, string> = {
  'int': 'number',
  'long': 'number',
  'float': 'number',
  'double': 'number',
  'decimal': 'number',
  'short': 'number',
  'byte': 'number',
  'sbyte': 'number',
  'uint': 'number',
  'ulong': 'number',
  'ushort': 'number',
  'string': 'string',
  'String': 'string',
  'bool': 'boolean',
  'Boolean': 'boolean',
  'DateTime': 'Date | string',
  'DateTimeOffset': 'Date | string',
  'Guid': 'string',
  'char': 'string',
  'object': 'any',
  'dynamic': 'any',
  'void': 'void',
};

interface TypeMapping {
  tsType: string;
  isNullable: boolean;
  isArray: boolean;
}

function mapBaseType(csharpType: string): string {
  return TYPE_MAP[csharpType] ?? csharpType;
}

function mapCsharpType(rawType: string): TypeMapping {
  let type = rawType.trim();
  let isNullable = false;
  let isArray = false;

  // Check for nullable suffix
  if (type.endsWith('?')) {
    isNullable = true;
    type = type.slice(0, -1);
  }

  // Check for C# array syntax: Type[]
  if (type.endsWith('[]')) {
    isArray = true;
    type = type.slice(0, -2);
  }

  // Check for generic collection types
  const collectionMatch = type.match(
    /^(?:List|IList|IEnumerable|ICollection|IReadOnlyList|IReadOnlyCollection|HashSet|ISet)<(.+)>$/
  );
  if (collectionMatch) {
    isArray = true;
    type = collectionMatch[1].trim();
  }

  // Check for Dictionary/IDictionary
  const dictMatch = type.match(
    /^(?:Dictionary|IDictionary|IReadOnlyDictionary)<(.+),\s*(.+)>$/
  );
  if (dictMatch) {
    const keyType = mapBaseType(dictMatch[1].trim());
    const valueType = mapBaseType(dictMatch[2].trim());
    return { tsType: `Record<${keyType}, ${valueType}>`, isNullable, isArray: false };
  }

  const tsBaseType = mapBaseType(type);
  return { tsType: tsBaseType, isNullable, isArray };
}

function buildTsProperty(name: string, mapping: TypeMapping): string {
  let typeStr = mapping.tsType;

  if (mapping.isArray) {
    typeStr = mapping.tsType.includes('|')
      ? `(${mapping.tsType})[]`
      : `${mapping.tsType}[]`;
  }

  if (mapping.isNullable) {
    typeStr = `${typeStr} | null`;
  }

  return `${name}: ${typeStr};`;
}

export function convertCsharpToTypescript(input: string): string {
  const lines = input.split('\n');
  const results: string[] = [];

  const propertyRegex =
    /^\s*(?:public|private|protected|internal)\s+(?:(?:static|virtual|override|abstract|readonly|new)\s+)*(.+?)\s+(\w+)\s*\{\s*get\s*;/;

  for (const line of lines) {
    const match = line.match(propertyRegex);
    if (match) {
      const rawType = match[1].trim();
      const propertyName = match[2];
      const mapping = mapCsharpType(rawType);
      results.push(buildTsProperty(propertyName, mapping));
    }
  }

  return results.join('\n');
}
