import { joinURL } from 'ufo';

const getBlockletPurchaseTemplate = (serviceUrl: string = 'https://registry.arcblock.io') => ({
  type: 'vc',
  value: {
    '@context': 'https://schema.arcblock.io/v0.1/context.jsonld',
    id: '{{input.id}}',
    tag: ['{{data.did}}'],
    type: ['VerifiableCredential', 'PurchaseCredential', 'NFTCertificate', 'BlockletPurchaseCredential'],
    issuer: {
      id: '{{ctx.issuer.id}}',
      pk: '{{ctx.issuer.pk}}',
      name: '{{ctx.issuer.name}}',
    },
    issuanceDate: '{{input.issuanceDate}}',
    credentialSubject: {
      id: '{{ctx.owner}}',
      sn: '{{ctx.id}}',
      purchased: {
        blocklet: {
          id: '{{data.did}}',
          url: '{{{data.url}}}',
          name: '{{data.name}}',
        },
      },
      display: {
        type: 'url',
        content: joinURL(serviceUrl, '/api/nft/display'), // accept asset-did in query param
      },
    },
    credentialStatus: {
      id: joinURL(serviceUrl, '/api/nft/status'),
      type: 'NFTStatusList2021',
      scope: 'public',
    },
    proof: {
      type: '{{input.proofType}}',
      created: '{{input.issuanceDate}}',
      proofPurpose: 'assertionMethod',
      jws: '{{input.signature}}',
    },
  },
});

export { getBlockletPurchaseTemplate };
export default {
  getBlockletPurchaseTemplate,
};
