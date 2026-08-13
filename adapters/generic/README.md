# Generic Adapter Contract

A Devland adapter converts resolved Devland context into target-native instructions or packaging without changing the underlying semantics.

Input: resolved Devland context plus available runtime capabilities.

Output: the smallest target-native representation needed for that runtime to discover and follow the relevant context.

Must preserve:

- project/work source-of-truth precedence;
- explicit exceptions to required policy;
- runtime capability limitations and honest completion status;
- progressive loading rather than unconditional context duplication.

Must not own:

- canonical product facts;
- canonical work state;
- repository auth or provider credentials;
- vendor actions or repository-provider implementation logic;
- independently maintained copies of project architecture or stack truth.

Adapters may add target-specific routing metadata, but they may not redefine the project to fit a target agent.
