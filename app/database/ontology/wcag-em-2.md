<!--
  Source: https://www.w3.org/TR/wcag-em-2/
  WCAG Evaluation Methodology (WCAG-EM) 2.0 - W3C Group Note, 23 July 2026
  Retrieved and converted to markdown on 2026-07-27.
  Copyright (c) W3C (MIT, ERCIM, Keio, Beihang). Document licensed under the
  W3C Document License: https://www.w3.org/copyright/document-license/
-->

# WCAG Evaluation Methodology (WCAG-EM) 2.0

[W3C Group Note](https://www.w3.org/standards/types#NOTE) 23 July 2026

More details about this document

This version:
     <https://www.w3.org/TR/2026/NOTE-wcag-em-2-20260723/>
Latest published version:
     <https://www.w3.org/TR/wcag-em-2/>
Latest editor's draft:
    <https://w3c.github.io/wai-wcag-em/>
History:
     <https://www.w3.org/standards/history/wcag-em-2/>
     [Commit history](https://github.com/w3c/wai-wcag-em/commits/)
Editors: 
     [Hidde de Vries](mailto:hidde.vries@logius.nl) (Logius) 
     [Jeroen Hulscher](mailto:jeroen.hulscher@logius.nl) (Logius) 
     [Steve Faulkner](mailto:sfaulkner@tetralogical.com) (Tetralogical) 
Former editors: 
     Eric Velleman (Accessibility Foundation) 
     Shadi Abou-Zahra (W3C/WAI) 
Feedback:
     [GitHub w3c/wai-wcag-em](https://github.com/w3c/wai-wcag-em/) ([pull requests](https://github.com/w3c/wai-wcag-em/pulls/), [new issue](https://github.com/w3c/wai-wcag-em/issues/new/choose), [open issues](https://github.com/w3c/wai-wcag-em/issues/)) 
Previous version
     <https://www.w3.org/TR/2014/NOTE-WCAG-EM-20140710/>

[Copyright](https://www.w3.org/policies/#copyright) © 2022-2026 [World Wide Web Consortium](https://www.w3.org/). W3C® [liability](https://www.w3.org/policies/#Legal_Disclaimer), [trademark](https://www.w3.org/policies/#W3C_Trademarks) and [document use](https://www.w3.org/copyright/document-license/ "W3C Document License") rules apply. 

* * *

## Abstract

This document describes a methodology with a step-by-step process to evaluate how well digital products conform to [Web Content Accessibility Guidelines (WCAG) 2](https://www.w3.org/WAI/standards-guidelines/wcag/). 

It provides technology-agnostic guidance to define the evaluation scope, explore the target product, select a representative [sample set](https://www.w3.org/TR/wcag-em-2/#dfn-sample-set) from products, evaluate the selected sample set, and report the evaluation findings. This procedure is suitable for use in different evaluation contexts, including self-assessment and third-party evaluation. 

This document does not define feature-specific instructions, as the WCAG success criteria and [supporting documents](https://www.w3.org/WAI/standards-guidelines/wcag/docs/) cover those. It also does not define additional WCAG 2 requirements, nor does it replace or supersede them in any way.

## Status of This Document

 _This section describes the status of this document at the time of its publication. A list of current W3C publications and the latest revision of this technical report can be found in the [W3C standards and drafts index](https://www.w3.org/TR/)._

This document builds on WCAG-EM 1.0, which was developed by the [WCAG 2.0 Evaluation Methodology (Eval) Task Force](https://www.w3.org/WAI/ER/2011/eval/eval-tf), a joint task force of the Web Content Accessibility Guidelines (WCAG) Working Group (now renamed [Accessibility Guidelines (AG) Working Group](https://www.w3.org/WAI/about/groups/agwg/)) and the [Evaluation and Repair Tools (ERT) Working Group](https://www.w3.org/groups/wg/ertwg/). It provides informative guidance on evaluation in accordance with [Web Content Accessibility Guidelines (WCAG) 2](https://www.w3.org/WAI/intro/wcag).

This document was published by the [Accessibility Guidelines Working Group](https://www.w3.org/groups/wg/ag) as a Group Note using the [Note track](https://www.w3.org/policies/process/20250818/#recs-and-notes). 

This Group Note is endorsed by the [Accessibility Guidelines Working Group](https://www.w3.org/groups/wg/ag), but is not endorsed by W3C itself nor its Members. 

The [W3C Patent Policy](https://www.w3.org/policies/patent-policy/) does not carry any licensing requirements or commitments on this document. 

This document is governed by the [18 August 2025 W3C Process Document](https://www.w3.org/policies/process/20250818/). 

## Introduction

This document describes a process to comprehensively evaluate whether a representative sampling of a digital product conforms to [Web Content Accessibility Guidelines (WCAG) 2](https://www.w3.org/TR/WCAG22/). 

Accessibility evaluations of digital products can be necessary in many situations, such as before releasing, acquiring, or redesigning a product, and for periodic monitoring of the accessibility performance of a product over time.

Several factors can impact an evaluation, including: 

  * the type of digital product (for example, website, mobile application, kiosk, document),
  * the size of a digital product, its complexity, and which technologies it uses (for example, HTML, WAI-ARIA, PDF, EPUB),
  * the degree of knowledge the evaluators have about how the product was designed and developed, and
  * the main purpose for the evaluation (for example, to issue an accessibility statement, to plan a redesign process, to perform research).

This document takes these factors into account and highlights several considerations for evaluators. It provides a common framework for accessibility evaluations that acts as a roadmap, helping evaluators apply good practice, avoid commonly made mistakes, and achieve more comparable results.

This document does not replace the need for quality assurance throughout all phases of product development. **It also does not in any way add to or change the requirements defined by the normative WCAG 2 standard** , nor does it provide instructions on feature-by-feature evaluation of web content. The methodology can be used together with techniques to meet WCAG 2 success criteria, such as the [Techniques for WCAG 2.2](https://www.w3.org/WAI/WCAG22/Techniques/), but does not require this or any other specific set of techniques.

### Target audience

This methodology is designed for anyone who wants to follow a common approach for evaluating the conformance of a representative sample of a digital product to WCAG 2. This includes:

  * consultants who want to analyze and report the accessibility conformance of a representative sample of a digital product in order to inform owners,
  * accessibility evaluation service providers who want to evaluate a representative sample of a digital product in order to validate accessibility conformance,
  * developers who want to evaluate the accessibility conformance of a representative sample of their digital products in order to monitor or improve them,
  * product owners, procurers, and suppliers who want to learn about the accessibility conformance of a representative sample of their digital products,
  * compliance and quality assurance managers who want to ensure that they meet quality and policy requirements,
  * accessibility monitoring activities used to benchmark and to compare accessibility conformance over time,
  * accessibility researchers and disability advocates who want to explore accessibility conformance practices,
  * accessibility trainers and educators who want to teach approaches for evaluating the accessibility of a representative sample of a digital product, and
  * content authors, designers, and others who want to learn more about digital accessibility and evaluation.

### Relation to WCAG 2 conformance claims

WCAG 2.2 defines [conformance requirements](https://www.w3.org/TR/WCAG22/#conformance-reqs) for individual web pages (and, in some cases, sets of web pages), but does not describe how to evaluate entire websites. It also defines how to make optional [conformance claims](https://www.w3.org/TR/WCAG22/#conformance-claims) to cover individual web pages, a series of web pages such as a multi-page form, and multiple related web pages such as a website. This applies when all web pages that are in the scope of a conformance claim have each been evaluated or created in a process that ensures that they each satisfy all the conformance requirements.

**WCAG 2 conformance claims cannot be made for entire websites based upon the evaluation of a selected sub-set of web pages and functionality alone** , as it is always possible that there will be unidentified conformance errors on these websites. In practice, in the majority of uses of this evaluation methodology, only a [sample](https://www.w3.org/TR/wcag-em-2/#dfn-sample) from a digital product is selected for evaluation. Thus, in the majority of situations, **using this methodology alone does not result in being able to make WCAG 2 conformance claims**. Guidance on making statements about the outcomes from using this methodology is provided in [Step 5.3: Provide an evaluation statement (optional)](https://www.w3.org/TR/wcag-em-2/#step5c).

## Using this methodology

This methodology is used for thorough evaluation of digital products using WCAG 2. Before evaluating an entire digital product it is usually good to do a preliminary evaluation of different [samples](https://www.w3.org/TR/wcag-em-2/#dfn-sample) from the target product to identify obvious accessibility barriers and develop an overall understanding of the accessibility of the digital product. 

[Easy Checks - A First Review of Web Accessibility](https://www.w3.org/WAI/test-evaluate/preliminary/) describes such an approach for preliminary evaluation that is complementary to this methodology.

### Required expertise

Users of this methodology are assumed to have solid understanding of how to evaluate content using WCAG 2, accessible design, assistive technologies, and of how people with different disabilities use digital products.

This includes an understanding of:

  * technologies,
  * accessibility barriers that people with disabilities experience,
  * assistive technologies and adaptive approaches that people with disabilities use, and
  * evaluation techniques, tools, and methods to identify barriers for people with disabilities.

In particular, it is assumed that users of this methodology are deeply familiar with all the resources listed in [Background reading](https://www.w3.org/TR/wcag-em-2/#reading).

### Combined expertise

This methodology can be carried out by an individual evaluator with the skills described in the previous section ([Required expertise](https://www.w3.org/TR/wcag-em-2/#expertise)), or a team of evaluators with collective expertise. 

Using the combined expertise of different evaluators may sometimes be necessary or beneficial when one evaluator alone does not possess all of the required expertise. 

[Using Combined Expertise to Evaluate Web Accessibility](https://www.w3.org/WAI/test-evaluate/combined-expertise/) provides further guidance on using combined expertise of review teams.

### Involving users

Involving people with disabilities (who are not experienced evaluators or part of a review team) may help identify additional accessibility barriers that are not easily discovered by expert evaluation alone. While not required for using this methodology, it is strongly recommended for evaluators to involve real people with a wide range of abilities during the evaluation process.

[Involving Users in Web Accessibility Evaluation](https://www.w3.org/WAI/test-evaluate/involving-users/) provides further guidance on involving users in web accessibility evaluation.

### Evaluation tools

This methodology is independent of any particular accessibility evaluation tool, web browser, and other software tool. While most accessibility checks are not fully automatable, evaluation tools can significantly assist evaluators during the evaluation process and contribute to more effective evaluation. For example, some accessibility evaluation tools can scan an entire digital product to help identify relevant [samples](https://www.w3.org/TR/wcag-em-2/#dfn-sample) for manual evaluation. Tools can also assist during manual (human) evaluation of accessibility checks. 

[Selecting Web Accessibility Evaluation Tools](https://www.w3.org/WAI/test-evaluate/tools/selecting/) provides further guidance on using tools.

## Scope of applicability

This methodology is designed to evaluate full, self-enclosed [digital products](https://www.w3.org/TR/wcag-em-2/#dfn-digital-product), such as websites. In [Step 1.1](https://www.w3.org/TR/wcag-em-2/#step1a), evaluators define what is in scope exactly. 

### Principle of product enclosure

Full product enclosure is essential, meaning that we define the scope to include all views, states and functionality of a digital product, without excluding specific parts. Excluding specific parts of a digital product from the scope would likely conflict with the WCAG 2.2 conformance requirements for [full pages](https://www.w3.org/TR/WCAG22/#cc2) and [complete processes](https://www.w3.org/TR/WCAG22/#cc3), or otherwise distort the evaluation results.

#### Example of product enclosure

An example of product enclosure could be the following banking website. It has distinct areas for personal banking, commercial banking, internet banking, and service and contact. It also has [common views](https://www.w3.org/TR/wcag-em-2/#dfn-common-views) that are linked from all pages, like their legal notice and sitemap:

When the target for evaluation is the whole banking website, then all of the depicted areas are within evaluation scope. This includes content such as application forms, authentication and internet banking. This includes 3rd party content used within the site. 

When the evaluation target is only a specific website area, like "Commercial banking", then all the parts of this area are within the evaluation scope. In this example, that means the evaluation scope would include Payments, Mortgage, Loans, and Savings, as well as the [common views](https://www.w3.org/TR/wcag-em-2/#dfn-common-views), the Legal notice, and Sitemap.

### Considerations for particular types of digital products

This methodology is applicable to a broad variety of digital products. The following provides considerations for particular situations. 

Websites
    Websites exist in many sizes, anywhere from just one page to collections of thousands or more pages. Websites with many pages can use the [sampling procedure](https://www.w3.org/TR/wcag-em-2/#step3) to select a representative [sample set](https://www.w3.org/TR/wcag-em-2/#dfn-sample-set). On websites with a few pages, all pages can be evaluated and the sampling procedure can be skipped. 

Web applications
    Web applications generally contain a lot of dynamically generated content and functionality. They tend to be more complex and interactive. Therefore, they typically require more time and effort to evaluate, and will typically need a larger [sample set](https://www.w3.org/TR/wcag-em-2/#dfn-sample-set). Some examples of web applications include web-based email clients, document editors, video sharing platforms, social media sites and booking platforms. 

Native, hybrid and cross-platform applications
    For native, hybrid and cross-platform applications, a list of URLs cannot be generated to base a representative [sample set](https://www.w3.org/TR/wcag-em-2/#dfn-sample-set) on. Instead, samples can be identified with unique screenshots and/or descriptions of the path that lead to the specific [sample](https://www.w3.org/TR/wcag-em-2/#dfn-sample).

Interfaces of kiosks, self-service terminals and set-top box interfaces
    When the interface can be tested in a browser, see the considerations for web applications.
    When the interface is evaluated while running on a hardware terminal, there is usually no way to generate a list of URLs. Samples can be identified with unique screenshots, photos and/or descriptions of the path that lead to the specific [sample](https://www.w3.org/TR/wcag-em-2/#dfn-sample).

Documents
    When the evaluation target is a single document, the evaluation is usually scoped to the whole document or specific parts of it, depending on document complexity. Note that URL(s) may not be available for a document sample. Instead the document title and, possibly, filename can be used to specify [samples](https://www.w3.org/TR/wcag-em-2/#dfn-sample).

**Note**

This is not an exhaustive list.

### Particular evaluation contexts

This methodology can be applied in different situations and contexts. The following considerations apply to particular situations and contexts for an evaluation:

Self-assessment of conformance
    In-house evaluators and evaluators who are part of the development process often have easier access to the developers and maintainers of the digital product, the development and hosting environments, the authoring tools, and the materials used for development and maintenance. Particular use cases, design analysis, technical specifications and documentation, and testing resources can make evaluation more effective and should be leveraged where possible.
Third-party assessment of conformance
    Independent external evaluators typically have less information about internal software, areas, and functionality of a digital product, as they have not been involved in its procurement and in how the digital product was designed and developed. Often evaluators in these situations need to contact the product's owner or developer to get necessary information that make the evaluation more effective.
Evaluating during development
    While this methodology has been primarily designed for reviewing digital products that are already developed, it is critical to evaluate accessibility throughout the design and implementation stages of a digital product to ensure its future conformance. The guidance provided in this methodology can be useful during these earlier stages of the design and development process, though some adaptation may be needed. However, it is important to be aware that evaluations carried out during these earlier stages can quickly become obsolete by implementing even minor changes. Consequently evaluations carried out during these stages should not be used for making statements nor conformance claims about the finalized digital product.
Evaluating third-party content
    Digital products do not control third-party content, like comments on a social media website or review aggregator. WCAG 2 provides specific considerations for the conformance of such type of content in the section [Statement of Partial Conformance](https://www.w3.org/TR/WCAG22/#conformance-partial). In such cases evaluators will need to determine whether such content is regularly monitored and repaired (within two business days), and whether non-conforming content is clearly identified as such in all the web pages in which it appears.
Re-running product evaluation
    Evaluation, according to this methodology, may be re-run after a short period; for example, when issues are identified and repaired by the product's owner or developer, or periodically to monitor progress. In such cases the evaluation can be carried out using a sample that includes a:

  * sub-set of the [samples](https://www.w3.org/TR/wcag-em-2/#dfn-sample) that were used in the preceding evaluation to facilitate comparability between the results, and
  * replaced sub-set of [samples](https://www.w3.org/TR/wcag-em-2/#dfn-sample) from those that were used in the preceding evaluation to improve view coverage.

Unless significant changes were made to the digital product, there is usually no need to change the size of the selected sample nor the approach used for sampling. The amount of replaced [samples](https://www.w3.org/TR/wcag-em-2/#dfn-sample) in a fresh [sample set](https://www.w3.org/TR/wcag-em-2/#dfn-sample-set) is typically about half of the initial sample set, though this could be increased when samples mostly conform to WCAG 2.

Large-scale evaluation
    Carrying out mass evaluation of many digital products — for example, for national or international surveying — is typically carried out by primarily using automated evaluation tools. Relatively few views undergo full manual inspection. Such evaluations do not usually address the necessary qualitative depth of conformance review per product for which this methodology is designed.

## Evaluation procedure

An evaluation procedure has five steps. Sometimes the order can vary, depending on the type of digital product and the purpose of the evaluation.

These are the steps: 

  1. Define the evaluation scope
  2. Explore the target product
  3. Select a representative sample set
  4. Evaluate the selected sample set
  5. Report the findings

Evaluators can proceed from one step to the next, and may return to any preceding step as new information is revealed to them during the process.

### Step 1: Define the evaluation scope 

**Methodology Requirement 1:** Define the evaluation scope according to [Methodology Requirement 1.1](https://www.w3.org/TR/wcag-em-2/#req1a), [Methodology Requirement 1.2](https://www.w3.org/TR/wcag-em-2/#req1b), and [Methodology Requirement 1.3](https://www.w3.org/TR/wcag-em-2/#req1c), and optionally [Methodology Requirement 1.4](https://www.w3.org/TR/wcag-em-2/#req1d).

Usually, this step involves the evaluation commissioner (who may or may not be the product's owner), to align expectations, and an initial exploration of the product.

#### Step 1.1: Define the scope of the digital product 

**Methodology Requirement 1.1:** Define the target [digital product](https://www.w3.org/TR/wcag-em-2/#dfn-digital-product) according to [Scope of applicability](https://www.w3.org/TR/wcag-em-2/#applicability), so that for each [view](https://www.w3.org/TR/wcag-3.0/#dfn-view) it is unambiguous whether it is within the scope of evaluation or not.

Define the target product, taking into account the considerations in [Scope of applicability](https://www.w3.org/TR/wcag-em-2/#applicability), for example:

  * All content on <https://example-museum.org>.
  * All content on Example's Museum Shop, located on <https://shop.example-museum.org>, except for the Temporary Art Collection

It is important to be clear and unambiguous in this step, and avoid any doubt regarding which views are in scope. Using formalizations including [regular expressions](https://en.wikipedia.org/wiki/Regular_expression) and listings of web addresses (URIs) is recommended where possible.

It is also important to document any particular aspects of the target product to support its identification. This includes:

  * use of third-party content and services,
  * mobile and language versions of the product, and
  * parts of the product, especially those that may not be easily identifiable as such — for example, an online shop that has a different web address but is still considered to be part of the target product, 
  * content or functionality related to specific WCAG success criteria,
  * content or functionality that may be subject to additional guidelines.

#### Step 1.2: Define the conformance target

**Methodology Requirement 1.2:** Select a target WCAG 2 [conformance level](https://www.w3.org/TR/WCAG22/#cc1) (A, AA, or AAA) for the evaluation.

**Note**

WCAG 2 Level AA is the generally accepted and recommended target.

**Note**

It is often useful to evaluate beyond the conformance target of the digital product. For example, a product might meet individual requirements from a higher conformance level. Documenting this information can help plan future improvements more effectively.

#### Step 1.3: Define an accessibility support baseline

**Methodology Requirement 1.3:** Define the web browser, assistive technologies and other [user agents](https://www.w3.org/TR/WCAG22/#dfn-user-agents) for which features provided on the digital product are to be [accessibility supported](https://www.w3.org/TR/WCAG22/#dfn-accessibility-supported).

Particularly for new technologies it is not always possible to ensure that every accessibility feature provided on a digital product, such as a “Show captions” function in a media player, is supported by every possible combination of operating system, web browser, assistive technology, and other user agents. WCAG 2 does not pre-define which combinations of features and technologies must be supported as this depends on the particular context of the product, including its language, the technologies that are used to create the content, and the user agents currently available. [Understanding Accessibility Support](https://www.w3.org/WAI/WCAG22/Understanding/conformance#accessibility-support) provides more guidance on the WCAG 2 concept of _accessibility support_.

During this step the evaluator determines the minimum set of combinations of operating systems, web browsers, assistive technologies, and other applications/user agents that the product is expected to work with, and that is in-line with the WCAG 2 guidance on accessibility support (linked above). This step is carried out in consultation with the evaluation commissioner to ensure common expectation for the targeted level of accessibility support. The product's owner and product's developer may also have such a list of combinations that the product was designed to support, which could be a starting point for this step. Depending on the purpose of the evaluation such a list may need to be updated. For example, the list may need to be updated to assess how well the product works with more current browsers.

**Note**

This initial definition of the baseline does not limit the evaluator from using additional operating systems, web browsers, assistive technologies and other user agents at a later point. For example, the evaluator may use additional combinations to evaluate content that was not identified at this early stage of the evaluation process. In this case the baseline is extended with the additional tools that were used.

**Note**

For some products in closed networks, such as an intranet product, where both the users and the computers used to access the product are known, this baseline may be limited to the operating systems, applications, web browsers and assistive technologies used within this closed network. However, in most cases this baseline is ideally broader to cover the majority of current user agents used by people with disabilities in any applicable particular geographic region and language community.

#### Step 1.4: Define additional evaluation requirements (optional) 

**Methodology Requirement 1.4:** Define any additional evaluation requirements agreed by the [evaluator](https://www.w3.org/TR/wcag-em-2/#dfn-evaluator) and [evaluation commissioner](https://www.w3.org/TR/wcag-em-2/#dfn-evaluation-commissioner) (optional).

An evaluation commissioner may be interested in additional information beyond what is needed to evaluate the extent of conformance of the target product to WCAG 2. For example, an evaluation commissioner might be interested in:

  * evaluation of additional views beyond what is needed to form a representative sample set from the target digital product,
  * reports of all occurrences of issues rather than representative examples of the types of issues on the target digital product,
  * analysis of particular use cases, situations, and user groups for interacting with the target digital product,
  * description of possible solutions to the issues encountered beyond the scope of the evaluation,
  * evaluation involving users with disabilities, and
  * adherence to specific documentation or reporting templates.

Such additional evaluation requirements that are agreed on with the evaluator need to be clarified early on and documented. This also needs to be reflected in the resulting report. For example, additional requirements may be needed later to clarify how the selection of the sample set was carried out.

### Step 2: Explore the target digital product

**Methodology Requirement 2:** Explore the digital product to be evaluated according to [Methodology Requirement 2.1](https://www.w3.org/TR/wcag-em-2/#req2a), [Methodology Requirement 2.2](https://www.w3.org/TR/wcag-em-2/#req2b), [Methodology Requirement 2.3](https://www.w3.org/TR/wcag-em-2/#req2c), [Methodology Requirement 2.4](https://www.w3.org/TR/wcag-em-2/#req2d), and [Methodology Requirement 2.5](https://www.w3.org/TR/wcag-em-2/#req2e).

During this step the evaluator explores the target product to be evaluated, to develop an initial understanding of the product and its use, purpose, and functionality. Much of this will not be immediately apparent to evaluators, in particular to those from outside the development team. In some cases it is also not possible to exhaustively identify and list all functionality, types of views, and technologies used to realize the product. Involvement of product owners and product developers can help evaluators make their explorations more effective.

**Note**

Carrying out initial cursory checks during this step helps identify views that are relevant for more detailed evaluation later on. For example, an evaluator may identify views that seem to be lacking color contrast, document structure, or consistent navigation, and note them down for more detailed evaluation later on.

**Note**

To carry out this step it is critical that the evaluator has access to all the relevant parts of the product. For example, it may be necessary to create an account and ensure that the product's configuration is representative. When products display data, it may be necessary to pre-fill realistic data before starting the evaluation.

#### Step 2.1: Identify common views of the digital product

**Methodology Requirement 2.1:** Identify the [common views](https://www.w3.org/TR/wcag-em-2/#dfn-common-views) of the target product.

Explore the target product to identify its common views, which may also be specific states of views. Typically these are linked directly from the main entry point of the target product (like the home page on a website, or the start screen of an app), and often linked from the header, navigation, and footer sections of other views. The outcome of this step is a list of all common pages or views of the target product.

#### Step 2.2: Identify essential functionality of the digital product

**Methodology Requirement 2.2:** Identify an initial list of [essential functionality](https://www.w3.org/TR/wcag-em-2/#dfn-functionality) of the target product.

Explore the target product to identify its essential functionality. While some functionality will be easy to identify, others will need more deliberate discovery. For example, it may be easier to identify the functionality for purchasing products in an online shop than the functionality provided for vendors to sell products through the shop. The outcome of this step is a list of functionality that users can perform on the product. This list will be used in the following steps to help select representative samples for evaluation.

**Note**

The purpose of this step is not to exhaustively identify all functionality of a product but to determine those that are essential to the purpose and goal of the target product. This will inform later selection of samples and their evaluation. Other functionality will also be included in the evaluation but through other selection mechanisms.

: Product functionality examples

  * Selecting and purchasing products from the web shop
  * Completing and submitting the survey forms
  * Registering for an account on the product

#### Step 2.3: Identify the variety of sample types

**Methodology Requirement 2.3:** Identify the types of samples.

Samples with varying styles, layouts, structures, and functionality often have varying support for accessibility. They are often generated by different templates and scripts, or authored by different people. They may appear differently, behave differently, and contain different content depending on the particular product user and context.

During this step the evaluator explores the target product to identify the different **types** of samples. The outcome of this step is a list of descriptions of the types of content identified, rather than specific instances of samples. This list will be used in the following steps to help select a representative sample set for evaluation.

**Note**

Evaluators are encouraged to ask the evaluation commissioner about different types of samples as well as previous assessments, to ensure different types of content are well represented in their evaluation.

: Sample type examples

Examples of the different types of sample that evaluators can look for include ones that:

  * vary in style, layout, structure, navigation, interaction, and visual design,
  * include different types of content, such as forms, tables, lists, headings, multimedia, and scripting,
  * include different functional components, such as date pickers, modal overlays, and carousels,
  * use different technologies, such as HTML, CSS, JavaScript, WAI-ARIA, PDF, and EPUB
  * are drawn from different areas of the product (such as home page, web shop, and other departments), including any applications,
  * reflect different coding styles and [templates](https://www.w3.org/TR/ATAG20/#def-Template) (if this is known to the evaluator),
  * are authored by different people, departments, or other entities (if this is known to the evaluator),
  * change in appearance and behavior depending on the user, device, browser, context, and settings,
  * include dynamic content, error messages, dialog boxes, pop-up windows, and other interactions.

#### Step 2.4: Identify technologies relied upon

**Methodology Requirement 2.4:** Identify the technologies [relied upon](https://www.w3.org/TR/WCAG22/#dfn-relied-upon) to provide the product.

During this step, the technologies relied upon for conformance are identified. This can include technologies such as HTML, CSS, JavaScript, SVG, WAI-ARIA, PDF, and EPUB. The outcome of this step is a list of technologies that are [relied upon according to WCAG 2](https://www.w3.org/TR/WCAG22/#dfn-relied-upon). This list will be used in the following steps to help select representative samples for evaluation.

**Note**

It is also encouraged to identify other systems relied on for conformance. For example:

  * authoring tool(s), like content management system(s)
  * design system(s)
  * front-end frameworks and libraries
  * native platforms and/or native programming languages

It is encouraged to be as detailed as possible, for instance, by including version numbers and configuration information. This can make evaluation more efficient.

#### Step 2.5: Identify other relevant samples

**Methodology Requirement 2.5:** Identify other samples that are relevant to people with disabilities and to accessibility of the digital product.

Some digital products include samples that are specifically relevant for people with disabilities and the accessibility of the digital product. The outcome of this step is a list of such samples, if they have not already been identified as part of [Step 2.1: Identify common views of the digital product](https://www.w3.org/TR/wcag-em-2/#step2a).

: Other relevant samples

Other samples include those that:

  * explain the accessibility features of the digital product
  * provide information and help on using the digital product
  * explain settings, preferences, options, shortcuts, and similar features
  * provide contact information, directions, and support instructions
  * support sensitive or high-risk functionality such as authentication, managing personal information, or financial transactions.

### Step 3: Select a representative sample set

**Methodology Requirement 3:** Select a representative sample set from the digital product according to [Methodology Requirement 3.1](https://www.w3.org/TR/wcag-em-2/#req3a), [Methodology Requirement 3.2](https://www.w3.org/TR/wcag-em-2/#req3b), and [Methodology Requirement 3.3](https://www.w3.org/TR/wcag-em-2/#req3c).

Select a sample set that is representative of the target product to be evaluated. This helps ensure that the evaluation results reflect the accessibility performance of the digital product with reasonable confidence. 

**Note**

If feasible, it is recommended to evaluate the entire digital product. The sampling procedure may then be skipped.

There are also other specific cases where it makes sense to skip the sampling procedure, and evaluate the entire digital product instead. Such cases include when the digital product:

  * has a small number of views — for example in some native apps or kiosks, and
  * cannot meaningfully be split into views — for example in certain kinds of documents.

When the sampling procedure is skipped, use the entire product as “selected sample set” in the remaining steps of this evaluation process.

The actual size of the sample set needed to evaluate a digital product depends on many factors, including the following:

  * **Size of the digital product** — products with more pages or views typically require a larger sample set to evaluate.
  * **Age of the digital product** — older digital products tend to have more (often not easy to find) content with different levels of complexity, consistency, and design and development processes, so a larger sample set is typically required to evaluate.
  * **Complexity of the digital product** — higher complexity requires a larger sample set to evaluate; consider the following:
    * **How interactive the content is** — products with content that is rich in interaction require larger sample sets to cover the functions provided by a sample and the different states that individual samples can have.
    * **How the content is generated** — products with content that is aggregated from different sources or that is processed as it is served (at runtime) typically require larger sample sets to cover the combinations of content that can be generated.
    * **How the content is implemented** — products that are available in different versions, served according to users and their preferences, or that adapt to access devices require larger sample sets to cover these different situations.
  * **Consistency of the product** — lower consistency requires a larger sample set to evaluate; consider the following:
    * **Variety of sample types** — products with a broader variety of sample types (see [Step 2.3: Identify the types of samples](https://www.w3.org/TR/wcag-em-2/#step2c)) require larger sample sets to evaluate.
    * **Variety of functionality** — digital products with a broader variety of functionality (see [Step 2.2: Identify essential functionality of the digital product](https://www.w3.org/TR/wcag-em-2/#step2b)), in particular different types of applications, require larger sample sets to evaluate.
    * **Variety of technologies** — digital products with a broader variety of technologies in use (see [Step 2.4: Identify technologies relied upon](https://www.w3.org/TR/wcag-em-2/#step2d)) require larger sample sets to evaluate.
    * **Variety of coding styles** — products with a broader variety of coding styles (typically these are from different scripts that generate the code, templates, and web page authors) require larger sample sets to evaluate.
  * **Adherence to development processes** — lower adherence requires a larger sample set to evaluate; consider the following:
    * **Formalization of the process** — products with formalized development and quality assurance processes tend to show more consistency in the coding and quality of the samples so that they typically require smaller sample sets to evaluate.
    * **Training for the developers** — products with designers, developers, and content authors who receive regular training tend to have more consistent accessibility performance, so they typically require smaller sample sets to evaluate.
    * **Development tools being used** — products that are developed and maintained using a consistent set of tools such as a content management system (CMS) also tend to be more consistent and require smaller sample sets to evaluate.
    * **Number of authors** — products that are developed and maintained by a more confined set of authors, including content editors, tend to be more consistent and require smaller sample sets to evaluate.
  * **Required level of confidence** — higher confidence in the evaluation results often requires evaluation of a larger sample set.
  * **Availability of prior evaluation findings** — smaller sample sets may be required when evaluators have access to prior evaluation findings, including test results from manual and automated accessibility testing.

The selection carried out during this step relies initially on the exploration carried out in [Step 2: Explore the target digital product](https://www.w3.org/TR/wcag-em-2/#step2). The selection is also continually refined during the following [Step 4: Evaluate the selected sample set](https://www.w3.org/TR/wcag-em-2/#step4), as the evaluator learns more about the particular implementation aspects of the target product.

#### Step 3.1: Include a structured sample set

**Methodology Requirement 3.1:** Select samples that reflect all identified (1) [common views](https://www.w3.org/TR/wcag-em-2/#dfn-common-views), (2) [essential functionality](https://www.w3.org/TR/wcag-em-2/#dfn-functionality), (3) types of samples, (4) technologies relied upon, and (5) other relevant samples.

Select a sample set that includes:

  1. common views identified in [Step 2.1: Identify common views of the digital product](https://www.w3.org/TR/wcag-em-2/#step2a),
  2. relevant samples identified in [Step 2.5: Identify other relevant samples](https://www.w3.org/TR/wcag-em-2/#step2e), and
  3. if not reflected in the previous steps, additional samples with:
     1. essential functionality identified in [Step 2.2: Identify essential functionality of the digital product](https://www.w3.org/TR/wcag-em-2/#step2b),
     2. different types of samples identified in [Step 2.3: Identify the types of samples](https://www.w3.org/TR/wcag-em-2/#step2c), and
     3. content using the technologies identified in [Step 2.4: Identify technologies relied upon](https://www.w3.org/TR/wcag-em-2/#step2d).

**Note**

An individual sample may reflect more than one of each of the criteria listed above. For example, a single sample may be representative of a particular design layout, functionality, and technologies used. The purpose of this step is to have representation of the different types of samples, functionality, and technologies that occur on the digital product. Careful selection of these representative instances can significantly reduce the required sample set size while maintaining appropriate representation of the entire digital product. The number of required instances of samples depends on the particular aspects of the digital product explained in the previous section, factors influencing the sample set size.

#### Step 3.2: Include a randomly selected sample set

**Methodology Requirement 3.2:** Select a random sample set, and include them for evaluation.

A randomly selected sample set acts as an indicator to verify that the structured sample set selected through the previous steps is sufficiently representative of the content provided on the website. This is an important step to improve the confidence in the overall evaluation outcome when the evaluation results from both selection approaches correlate.

The number of samples to randomly select is **10% of the structured sample set** selected through the previous steps. For example, if the structured sample set selected for a digital product resulted in 80 samples, then the random sample set size is 8 samples (which are added on top, so in that case, it would leave you with 88 samples in total).

To perform this selection, randomly select unique samples from the target digital product that are not already part of the structured sample set that was selected through the previous steps. Depending on the type of product and the evaluator's level of access to it, there are different techniques that may need to be used for this selection. The evaluator may:

  * use a tool that will traverse the digital product and propose a list of randomly selected samples,
  * use a script that will generate a list of all samples available on a digital product to select from,
  * manually list all pages, views, or screens in the digital product and pick items from that list randomly, and
  * use server logs, crawlers, search engines and other creative methods to get to a random sample set.

Document the samples that were randomly selected as these will need to be compared to the remaining structured sample set in [Step 4.3: Compare Structured and Random Samples Sets](https://www.w3.org/TR/wcag-em-2/#step4c).

**Note**

While the random sample set need not be selected according to strictly scientific criteria, the scope of the selection needs to span the entire scope of the digital product (any samples on the digital product may be selected), and the selection of individual samples does not follow a predictable pattern. Recording the method used to generate the random sample set is useful for ensuring the reliability and replicability of the findings.

**Note**

If the random sample set methodology picks a view that is identical to a view that is already part of the sample set, another view should be selected. If there are no new views to be found, this step should be considered completed.

#### Step 3.3: Include complete processes

**Methodology Requirement 3.3** Include all samples that are part of a [complete process](https://www.w3.org/TR/WCAG22/#cc3) in the selected sample set.

The selected sample set has to include all pages or views that belong to a series presenting a complete process. When samples belong to a process, all pages or views that belong to that same process have to be included.

Use the following steps to include the necessary samples:

  1. For each sample set selected through [Step 3.1: Include a structured sample set](https://www.w3.org/TR/wcag-em-2/#step3a) and [Step 3.2: Include a randomly selected sample set](https://www.w3.org/TR/wcag-em-2/#step3b) that is part of a process, locate the starting point (sample) for the process and include it in the selected sample.
  2. For each starting point for a process, identify and record at least the default sequence of samples to complete the process. Include these samples. 

**Note**

The default sequence follows the standard use case, describing the default path through the complete process. It assumes that there are no user input errors and no selection of additional options. For example, for a web shop application, the user would proceed to checkout, confirm the default payment option, provide all required payment details correctly, and complete the purchase, without changing the contents of the shopping cart, using a stored user profile, selecting alternative options for payment or shipping address, providing erroneous input, and so forth.

  3. For each process, identify and record the branch sequences of samples that are commonly accessed and critical for the successful completion of the process. Include these samples. 

**Note**

Branch sequences may terminate where they re-enter the default branch of the process. For example, adding a new shipping address will be registered as a critical alternative branch that leads back to the default branch of the process.

**Note**

In most cases, it is necessary to record and specify the actions needed to proceed from one sample to the next in a sequence to complete a process so that they can be replicated later. An example of such action could be "fill out name and address, and select the 'Submit' button". In most cases the web address (URL) will not be sufficient to identify the sample in a complete process. It is also useful to clearly record when samples are part of a process so that evaluators can focus their effort on the relevant changes, such as elements that were added, modified, or made visible.

### Step 4: Evaluate the selected sample set

**Methodology Requirement 4:** Evaluate the selected sample set according to [Methodology Requirement 4.1](https://www.w3.org/TR/wcag-em-2/#req4a), [Methodology Requirement 4.2](https://www.w3.org/TR/wcag-em-2/#req4b), and [Methodology Requirement 4.3](https://www.w3.org/TR/wcag-em-2/#req4c).

During this step the evaluator evaluates (in detail) all of the samples selected in [Step 3: Select a representative sample set](https://www.w3.org/TR/wcag-em-2/#step3), and compares the structured sample set to the randomly selected sample set. The evaluation is carried out according to the five WCAG 2 [conformance requirements](https://www.w3.org/TR/WCAG22/#conformance-reqs) at the target conformance level defined in [Step 1.2: Define the conformance target](https://www.w3.org/TR/wcag-em-2/#step1b).

The five WCAG 2.2 conformance requirements are:

  1. [Conformance Level](https://www.w3.org/TR/WCAG22/#cc1)
  2. [Full pages](https://www.w3.org/TR/WCAG22/#cc2)
  3. [Complete processes](https://www.w3.org/TR/WCAG22/#cc3)
  4. [Only Accessibility-Supported Ways of Using Technologies](https://www.w3.org/TR/WCAG22/#cc4)
  5. [Non-Interference](https://www.w3.org/TR/WCAG22/#cc5)

Further guidance on evaluating against these conformance requirements is provided in the following sections. The [WCAG 2 Layers of Guidance](https://www.w3.org/TR/WCAG22/#wcag-2-layers-of-guidance) and [Understanding Conformance](https://www.w3.org/WAI/WCAG22/Understanding/conformance) provide more background and guidance on the WCAG 2 conformance requirements, which is beyond the scope of this document.

**Note**

Carrying out this step requires deep understanding of the WCAG 2 conformance requirements and the expertise described in section [Required expertise](https://www.w3.org/TR/wcag-em-2/#expertise).

#### Step 4.1: Check all initial samples

**Methodology Requirement 4.1:** Check that each sample that is not within or at the end of a complete process conforms to each of the five WCAG 2 conformance requirements at the target conformance level.

For each sample selected in [Step 3: Select a representative sample set](https://www.w3.org/TR/wcag-em-2/#step3) that is not within or at the end of a complete process, check its conformance with each of the five WCAG conformance requirements, with the target conformance level defined in [Step 1.2: Define the conformance target](https://www.w3.org/TR/wcag-em-2/#step1b). This includes all components of the sample without activating any functions, entering any data, or otherwise initiating a process. Such functionality and interaction, including samples that are within or the end of a complete process, will be evaluated in the subsequent step.

**Note**

Many samples will have components, such as the header, navigation bars, search form, and others that occur repeatedly. While the requirement is to check [full pages](https://www.w3.org/TR/WCAG22/#cc2), typically these components do not need to be re-evaluated on each occurrence unless they appear or behave differently, or when additional evaluation requirements are defined in [Step 1.4: Define additional evaluation requirements (optional)](https://www.w3.org/TR/wcag-em-2/#step1d).

##### WCAG 2 success criteria

There are typically several ways to determine whether WCAG 2 success criteria have been met or not met. W3C/WAI provides one set of (non-normative) [Techniques for WCAG 2.2](https://www.w3.org/WAI/WCAG22/Techniques/), which documents ways of meeting particular WCAG 2 success criteria. It also includes documented _common failures_ , which are known ways in which content does not meet particular WCAG 2 success criteria. [Understanding Techniques for WCAG success criteria](https://www.w3.org/WAI/WCAG22/Understanding/) provides more guidance on the WCAG 2 concept of _Techniques_.

Evaluators can use such documented guidance to check whether particular web content meets or fails to meet WCAG 2 success criteria. Documented techniques and failures can also be useful background in evaluation reports. However, it is not required to use the particular set of techniques and failures documented by W3C/WAI. In fact, evaluators do not need to follow any techniques and failures at all. Evaluators might use other approaches to evaluate whether WCAG 2 success criteria have been met or not met. For example, evaluators may utilize specific testing instructions and protocols that meet the [requirements for sufficient techniques](https://www.w3.org/WAI/WCAG22/Understanding/understanding-techniques#sufficient-techniques), and that may be publicly documented or only available to the evaluators. More guidance on the use of techniques is provided in the previously linked [Understanding Techniques for WCAG Success Criteria](https://www.w3.org/WAI/WCAG22/Understanding/understanding-techniques).

**Note**

WCAG 2 success criteria are each formulated as a “testable statement that will be either true or false when applied to specific web content”. When there is no content presented to the user that relates to specific success criteria (for example, no video on the web page), then the success criteria are "satisfied" according to WCAG 2. Optionally, an evaluation report can specifically indicate success criteria for which there is no relevant content, for example, with "not present". [Understanding Conformance](https://www.w3.org/WAI/WCAG22/Understanding/conformance) provides more background and guidance.

##### Conforming alternate versions

Content on a sample might have alternate versions. For example, video content may be provided in a version with and without captions. In some cases an entire sample set (or series of them) may be provided as an alternate version to an initial sample. Conformance to WCAG 2 can be achieved with the help of alternate versions that meet the requirements listed in the WCAG 2 definition for [conforming alternate version](https://www.w3.org/TR/WCAG22/#dfn-conforming-alternate-versions). For example, a web page with video content without captions could still meet WCAG 2 by providing an alternate version for the video that qualifies to be a _conforming alternate version_. [Understanding Conforming Alternate Versions](https://www.w3.org/WAI/WCAG22/Understanding/conformance#conforming-alt-versions) provides further guidance on conforming alternate versions that is beyond the scope of this document.

**Note**

Alternate versions are not considered to be separate samples but part of the content. Samples are evaluated together with their alternate versions as one unit ([full page](https://www.w3.org/TR/WCAG22/#cc2)).

##### Accessibility support

Content on a sample needs to be provided in a way that is _accessibility supported_ (either directly or through an alternate version). For example, the captions for a video need to be provided in a way that they can be displayed to users. The WCAG 2 definition for [accessibility supported](https://www.w3.org/TR/WCAG22/#dfn-accessibility-supported) defines specific requirements for the use of [web content technologies](https://www.w3.org/TR/WCAG22/#dfn-technologies) to qualify as accessibility-supported. [Understanding Accessibility Support Web Technology Uses](https://www.w3.org/WAI/WCAG22/Understanding/conformance#documented-lists) provides further guidance on accessibility support that is beyond the scope of this document. However, WCAG 2 does not define a particular threshold or set of software that a digital product needs to support for accessibility. The definition of such a baseline depends on several parameters including the purpose, target audience, and language of the digital product. The baseline used to evaluate a particular digital product is defined in [Step 1.3: Define an accessibility support baseline](https://www.w3.org/TR/wcag-em-2/#step1c).

##### Non-interference

Content on a sample may not conform to WCAG 2, even though the sample as a whole might still conform to WCAG 2. For example, information and functionality may be provided using [web content technologies](https://www.w3.org/TR/WCAG22/#dfn-technologies) that are not yet widely supported by assistive technologies or in a way that is not supported by assistive technologies, accompanied by a conforming alternate version for the information and functionality that is accessibility supported. In this case the non-conforming content must not negatively interfere with the conforming content so that the sample can conform to WCAG 2. The WCAG 2 conformance requirement for [non-interference](https://www.w3.org/TR/WCAG22/#cc5) defines specific requirements for content to qualify as non-interfering. [Understanding Requirement 5](https://www.w3.org/WAI/WCAG22/Understanding/conformance#conf-req5) provides further guidance on non-interference that is beyond the scope of this document.

#### Step 4.2: Check all complete processes

**Methodology Requirement 4.2:** Check that all interaction for each sample that is part of a [complete process](https://www.w3.org/TR/WCAG22/#cc3) conforms to each of the five WCAG 2 conformance requirements at the target conformance level.

For each complete process identified in [Step 3.3: Include complete processes](https://www.w3.org/TR/wcag-em-2/#step3c), follow the identified default and branch sequences of samples, and evaluate each according to [Step 4.1: Check all initial samples](https://www.w3.org/TR/wcag-em-2/#step4a). However, in this case it is not necessary to evaluate all content but only the content that changes along the process.

Functionality, entering data, notifications, and other interaction is part of this check. In particular, it includes:

  * interaction with forms, input elements, dialog boxes, and other components,
  * confirmations for input, error messages, and other feedback from user interaction, and
  * behavior using different settings, preferences, devices, and interaction parameters.

#### Step 4.3: Compare structured and random sample sets

**Methodology Requirement 4.3:** Check that each sample in the randomly selected sample set does not show types of content and outcomes that are not represented in the structured sample set.

While the individual occurrences of WCAG 2 success criteria will vary between the structured and randomly selected sample sets, the randomly selected sample set should not show new _types_ of content not present in the structured sample set. Also the outcomes from evaluating the randomly selected sample set should not show new findings to those of the structured sample set. If the randomly selected sample set shows new types of content or new evaluation findings then it is an indication that the structured sample set was not sufficiently representative of the content provided on the website. In this case evaluators need to go back to [Step 3: Select a representative sample set](https://www.w3.org/TR/wcag-em-2/#step3) to select additional samples that reflect the newly identified types of content and findings. Also the findings of [Step 2: Explore the target digital product](https://www.w3.org/TR/wcag-em-2/#step2) might need to be adjusted accordingly. This step is repeated until the structured sample set is adequately representative of the content provided on the digital product.

### Step 5: Report the evaluation findings

**Methodology Requirement 5:** Report the evaluation findings according to [Methodology Requirement 5.1](https://www.w3.org/TR/wcag-em-2/#req5a) and optionally [Methodology Requirement 5.2](https://www.w3.org/TR/wcag-em-2/#req5b), [Methodology Requirement 5.3](https://www.w3.org/TR/wcag-em-2/#req5c), [Methodology Requirement 5.4](https://www.w3.org/TR/wcag-em-2/#req5d), and [Methodology Requirement 5.5](https://www.w3.org/TR/wcag-em-2/#req5e).

While evaluation findings are reported at the end of the process, documenting them is carried out throughout the evaluation process to ensure verifiable outcomes. The documentation typically has varying levels of confidentiality. For example, documenting the specific methods used to evaluate individual requirements might remain limited to the evaluator while reports about the outcomes from these checks are typically made available to the evaluation commissioner. Product owners might further choose to make public statements about the outcomes from evaluation according to this methodology.

#### Step 5.1: Document the outcomes of each step

**Methodology Requirement 5.1:** Document each outcome of the steps defined in [Step 1: Define the evaluation scope](https://www.w3.org/TR/wcag-em-2/#step1), [Step 2: Explore the target digital product](https://www.w3.org/TR/wcag-em-2/#step2), [Step 3: Select a representative sample set](https://www.w3.org/TR/wcag-em-2/#step3), and [Step 4: Evaluate the selected sample set](https://www.w3.org/TR/wcag-em-2/#step4).

For transparency, replicability of the evaluation results and justifications for any statements made based on this evaluation, it is essential to document the outcomes for each of the previous steps (including all sub-sections). 

[[WCAG-EM-Report-Tool](https://www.w3.org/TR/wcag-em-2/#bib-wcag-em-report-tool "WCAG-EM Report Tool")] helps generate reports based on the steps in this document.

This **documentation does not need to be public** , the level of confidentiality is usually determined by the evaluation commissioner.

Include at least the following:

  * **About the evaluation**
    * Name of the [evaluator](https://www.w3.org/TR/wcag-em-2/#dfn-evaluator) (optionally including contact details)
    * Name of the [evaluation commissioner](https://www.w3.org/TR/wcag-em-2/#dfn-evaluation-commissioner)
    * Date of the evaluation (completion date or duration period)
    * Optional: Version number and/or unique identifier of the evaluation
    * Optional: List of dates, such as the date of the initial report and dates of repeat evaluations
    * Optional: Name of the person, team or organization responsible for the digital product (this may be different from the evaluation commissioner)
    * Optional: Methodology used for evaluation
  * **Evaluation scope**
    * Scope of the digital product defined in [Step 1.1: Define the scope of the digital product](https://www.w3.org/TR/wcag-em-2/#step1a)
    * Conformance target defined in [Step 1.2: Define the conformance target](https://www.w3.org/TR/wcag-em-2/#step1b)
    * Accessibility support baseline defined in [Step 1.3: Define an accessibility support baseline](https://www.w3.org/TR/wcag-em-2/#step1c)
    * Additional requirements, if any, defined in [Step 1.4: Define additional evaluation requirements (optional)](https://www.w3.org/TR/wcag-em-2/#step1d)
  * **Digital product exploration**
    * Technologies relied upon identified in [Step 2.4: Identify technologies relied upon](https://www.w3.org/TR/wcag-em-2/#step2d)
    * Optional: Common views identified in [Step 2.1: Identify common views of the digital product](https://www.w3.org/TR/wcag-em-2/#step2a)
    * Optional: Essential functionality identified in [Step 2.2: Identify essential functionality of the digital product](https://www.w3.org/TR/wcag-em-2/#step2b)
    * Optional: Variety of sample types identified in [Step 2.3: Identify the types of samples](https://www.w3.org/TR/wcag-em-2/#step2c)
    * Optional: Other relevant samples identified in [Step 2.5: Identify other relevant samples](https://www.w3.org/TR/wcag-em-2/#step2e)
  * **Representative sample set**
    * Pages or views selected through structured sampling in [Step 3.1: Include a structured sample set](https://www.w3.org/TR/wcag-em-2/#step3a)
    * Randomly selected samples and selection method used in [Step 3.2: Include a randomly selected sample set](https://www.w3.org/TR/wcag-em-2/#step3b)
    * Complete processes selected in [Step 3.3: Include complete processes](https://www.w3.org/TR/wcag-em-2/#step3c)
  * **Sample set evaluated**
    * Evaluation outcomes from [Step 4.1: Check all initial samples](https://www.w3.org/TR/wcag-em-2/#step4a)
    * Evaluation outcomes from [Step 4.2: Check all complete processes](https://www.w3.org/TR/wcag-em-2/#step4b)
    * Evaluation outcomes from [Step 4.3: Compare structured and random sample sets](https://www.w3.org/TR/wcag-em-2/#step4c)

**Note**

As part of documenting evaluation outcomes, clear issue descriptions, steps to reproduce, severity of the findings, screenshots and/or videos can help teams resolve issues more quickly.

**Note**

Depending on the desired granularity of the report documentation, the outcomes of [Step 4: Evaluate the selected sample set](https://www.w3.org/TR/wcag-em-2/#step4) may be provided for each evaluated sample, or aggregated over the entire sample set. Reports should include at least one example for each conformance requirement and WCAG 2 Success Criterion not met. It is also good practice for evaluators to indicate issues that occur repeatedly.

Reports may also include additional information depending on any additional evaluation requirements defined in [Step 1.4: Define additional evaluation requirements (optional)](https://www.w3.org/TR/wcag-em-2/#step1d). For example, an evaluation commissioner may request a report indicating every failure occurrence for every sample, more information about the nature and the causes of the identified failures, or repair suggestions to remedy the failures.

#### Step 5.2: Record the evaluation specifics (optional)

**Methodology Requirement 5.2:** Archive the samples evaluated, and record the evaluation tools, web browsers, assistive technologies, other software, and methods used to evaluate them (optional).

While optional, it is good practice for evaluators to keep record of the evaluation specifics. For example, evaluators may need to keep a record of the evaluation specifics to support conflict resolution in the case of dispute. This includes archiving the samples evaluated, and recording the evaluation tools, web browsers, assistive technologies, other software, and methods used to evaluate them. This recording is typically kept internal and not shared by the evaluator unless otherwise agreed on in [Step 1.4: Define additional evaluation requirements (optional)](https://www.w3.org/TR/wcag-em-2/#step1d).

Records of the evaluation specifics could include any of the following:

  * Copies of the files and resources of the samples; 

**Note**

Some tools can save the dynamically generated or modified content — the Document Object Model (DOM) — as displayed during the evaluation, rather than the initial content of the files and resources, which is often different;

  * Screenshots of the samples;
  * Description of the path to locate the samples, especially when they are part of a process;
  * Description of the settings, input, and actions used to generate or navigate to the samples. 
  * Specific test credentials (user-IDs, etc.) required to replicate a unique data set or workflow;
  * Names and versions of the evaluation tools, web browsers and add-ons, assistive technology, and other software used;
  * The methods, procedures, and techniques used to evaluate conformance to WCAG 2.

**Note**

This recording may apply globally for the entire evaluation, to individual samples, or to individual checks carried out within the evaluated sample set. A table or grid may be useful to record what was used for the different samples evaluated.

**Note**

Records of the evaluation specifics may include sensitive information such as internal code, passwords, and copies of data. They may need particular security and privacy precautions.

#### Step 5.3: Provide an evaluation statement (optional)

**Methodology Requirement 5.3:** Provide a statement describing the outcomes of the conformance evaluation (optional).

**Reminder:** In the majority of situations, using this methodology alone does not result in [WCAG 2 conformance claims](https://www.w3.org/TR/WCAG22/#conformance-claims) for the target digital product; see [Relation to WCAG 2 Conformance Claims](https://www.w3.org/TR/wcag-em-2/#context) for more background.

Product owners may wish to make public statements about the outcomes from evaluations following this methodology. This can be done when at least every non-optional methodology requirement is satisfied, the conformance target defined in [Step 1.2: Define the conformance target](https://www.w3.org/TR/wcag-em-2/#step1b) is satisfied by all samples evaluated (in [Step 4: Evaluate the selected sample set](https://www.w3.org/TR/wcag-em-2/#step4)), and the product owner commits to ensuring the validity and maintaining the accuracy of the evaluation statement made.

An evaluation statement according to this methodology includes at least the following information:

  1. **Date** of when the evaluation statement was issued;
  2. **Guidelines title, version and URI:** "Web Content Accessibility Guidelines 2.2 at <https://www.w3.org/TR/WCAG22/>";
  3. **Conformance level evaluated** : Level A, AA or AAA, as defined in [Step 1.2: Define the conformance target](https://www.w3.org/TR/wcag-em-2/#step1b);
  4. **Definition of the digital product** as defined in [Step 1.1: Define the scope of the digital product](https://www.w3.org/TR/wcag-em-2/#step1a);
  5. **Technologies relied upon** as identified in [Step 2.4: Identify technologies relied upon](https://www.w3.org/TR/wcag-em-2/#step2d);
  6. **Accessibility support baseline** as defined in [Step 1.3: Define an accessibility support baseline](https://www.w3.org/TR/wcag-em-2/#step1c).

Evaluation statements according to this methodology can also be made when only [partial conformance](https://www.w3.org/TR/WCAG22/#conformance-partial) to WCAG 2 has been achieved. In such cases the evaluation statements also include the following information:

  7. **Digital product areas** that do not conform to WCAG 2;
  8. **Reason for not conforming to WCAG 2:** "third-party content" or "lack of accessibility support for languages".

**Note**

Note: it is essential for evaluation statements and accompanying documentation, such as a conformance report, to be itself published in an accessible format.

#### Step 5.4: Provide an aggregated score (optional)

**Methodology Requirement 5.4:** Provide an Aggregated score (optional).

While aggregated scores provide a numerical indicator to help communicate progress over time, there is currently no single metric that is known to address the required reliability, accuracy, and practicality. In fact, aggregated scores can be misleading and do not provide sufficient context and information to understand the actual accessibility of a digital product. For this and other reasons WCAG 2 does not provide a rating scheme. A [W3C Research Report on Web Accessibility Metrics](https://www.w3.org/TR/accessibility-metrics-report/) provides more background on on-going research, different approaches, and limitations of scoring metrics that are beyond the scope of this document. Whenever a score is provided, it is essential that the scoring approach is documented and made available to the [evaluation commissioner](https://www.w3.org/TR/wcag-em-2/#dfn-evaluation-commissioner) along with the report, to facilitate transparency and repeatability.

#### Step 5.5: Provide machine-readable reports (optional)

**Methodology Requirement 5.5:** Provide machine-readable reports of the evaluation results (optional).

Machine-readable reports facilitate processing the evaluation results by authoring, accessibility evaluation tools, and quality assurance tools. The [Evaluation and Report Language (EARL)](https://www.w3.org/WAI/standards-guidelines/earl/) is a machine-readable format that was specifically designed for this purpose. It is recommended to use EARL for providing machine-readable reports. See also [Understanding Metadata](https://www.w3.org/WAI/WCAG22/Understanding/understanding-metadata) from WCAG 2 to learn more about uses of metadata, including machine-readable reports, such as EARL.

## Glossary

For the purposes of this document, the following terms and definitions apply:

common views
    views that are relevant to the entire digital product

**Note**

This includes the home, login, and other entry points, and, where applicable, contacts, help, legal information, and similar views that are typically linked from all other views (usually from the header, footer, or navigation menu).

**Note**

A definition for [view](https://www.w3.org/TR/wcag-em-2/#dfn-view) is provided below.

digital product
    coherent collection of one or more related views that together provide common use or functionality

Websites, web apps, e-books, kiosk apps, mobile apps and documents (PDF, Word, EPUB)

**Note**

The focus of this methodology is on full, self-enclosed digital products. Digital products may be composed of smaller subsets of views, each of which can be considered to be an individual product. For example, a digital product may include an online shop, an area for each department within the organization, a blog area, and other areas that may each be considered to be a digital product.

essential functionality
    functionality that, if removed, fundamentally changes the use or purpose of the product for users

**Note**

This includes information that users of a product refer to and tasks that they carry out to perform this functionality.

Examples of essential functionality include “selecting and purchasing an item from an online shop”, “completing and submitting a form provided in an application”, and “registering for an account on the kiosk”.

**Note**

Other functionality is not excluded from the scope of evaluation. The term “essential functionality” is intended to help identify critical samples and include them among others in an evaluation.

evaluator
    person, team of people, organization, in-house department, or other entity responsible for carrying out the evaluation
evaluation commissioner
    person, team of people, organization, in-house department, or other entity that commissioned the evaluation

**Note**

In many cases the evaluation commissioner may be the product owner or product developer, in other cases it may be another entity such as a procurer or an accessibility monitoring survey owner.

sample
    [view](https://www.w3.org/TR/wcag-em-2/#dfn-view) that is included in the [sample set](https://www.w3.org/TR/wcag-em-2/#dfn-sample-set)
sample set
    list of [samples](https://www.w3.org/TR/wcag-em-2/#dfn-sample) selected for evaluations
view
    

A [web page](https://www.w3.org/TR/WCAG22/#dfn-web-page-s), [document](https://www.w3.org/TR/wcag2ict-22/#document), [software](https://www.w3.org/TR/wcag2ict-22/#software) or [view](https://www.w3.org/TR/2026/WD-wcag-3.0-20260303/#dfn-view), or an equivalent unit of conformance defined in the accessibility standard being evaluated.

## Background reading

The information below, related to accessibility essentials, evaluation, and WCAG 2 is important to use this methodology. Evaluators who use this methodology are expected to be deeply familiar with all of the listed resources.

### Web accessibility essentials

The following documents introduce the essential components of accessibility and explain how people with disabilities use the web. They are critical to understand the broader context of accessibility evaluation:

  * [Essential Components of Web Accessibility](https://www.w3.org/WAI/fundamentals/components/)
  * [How People with Disabilities Use the Web](https://www.w3.org/WAI/people-use-web/)

### Evaluating digital products for accessibility

These are particularly important resources that outline different approaches to evaluate digital products for accessibility:

  * [Easy Checks - A First Review of Web Accessibility](https://www.w3.org/WAI/test-evaluate/easy-checks/)
  * [Involving Users in Evaluating Web Accessibility](https://www.w3.org/WAI/test-evaluate/involving-users/)
  * [Selecting Web Accessibility Evaluation Tools](https://www.w3.org/WAI/test-evaluate/tools/selecting/)
  * [Using Combined Expertise to Evaluate Web Accessibility](https://www.w3.org/WAI/test-evaluate/combined-expertise/)

### Web Content Accessibility Guidelines (WCAG) 2

This is the internationally recognized standard that explains how to make web content more accessible to people with disabilities. The following resources are particularly important for accessibility evaluation of digital products:

  * [Web Content Accessibility Guidelines (WCAG) Overview](https://www.w3.org/WAI/standards-guidelines/wcag/)
  * [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)
  * [How to Meet WCAG 2 (Quick Reference)](https://www.w3.org/WAI/WCAG22/quickref/)
  * [Understanding WCAG 2.2 - A guide to understanding and implementing Web Content Accessibility Guidelines 2.2](https://www.w3.org/WAI/WCAG22/Understanding/)
  * [Techniques and Failures for Web Content Accessibility Guidelines 2.2](https://www.w3.org/WAI/WCAG22/Techniques/)

### ICT accessibility

  * [Guidance on Applying WCAG 2.2 to Mobile Applications (WCAG2Mobile)](https://www.w3.org/TR/wcag2mobile-22/)
  * [Guidance on Applying WCAG 2 to Non-Web Information and Communications Technologies (WCAG2ICT)](https://www.w3.org/TR/wcag2ict-22/)

### Other standards which incorporate WCAG 2 by reference

  * [Section 508 of the Rehabilitation Act](https://www.access-board.gov/ict/)
  * [ETSI EN 301 549 V3.2.1 (2021-03): Accessibility requirements for ICT products and services](http://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) (PDF)
  * [CAN/ASC - EN 301 549:2024](https://accessible.canada.ca/creating-accessibility-standards/canasc-en-301-5492024-accessibility-requirements-ict-products-and-services)

## Acknowledgments

For the 2.0 update, contributors included Shadi Abou-Zahra; Jason Ament; Alastair Campbell; Tamsin Ewing; Mike Gifford; Jan Jaap de Groot; Ian Lloyd; Wendy Meerkerk; Iacobien Riezebosch; Eric Velleman; Kevin White; Paul van Workum.

Editors also solicited feedback in evaluator interviews from Roel Antonisse; Sacha Bogaers; Bram Duvigneau; Stefan Farnetani; Detlev Fischer; Ronny Hendriks; Sophie Ragas; Savitri Sinnema.

Past active participants of the [WCAG 2.0 Evaluation Methodology (Eval) Task Force](https://www.w3.org/WAI/ER/2011/eval/eval-tf) included: Shadi Abou-Zahra; Frederick Boland; Denis Boudreau; Amy Chen; Vivienne Conway; Bim Egan; Michael Elledge; Gavin Evans; Wilco Fiers; Detlev Fischer; Elizabeth Fong; Vincent François; Alistair Garrison; Emmanuelle Gutiérrez y Restrepo; Katie Haritos-Shea; Martijn Houtepen; Peter Korn; Maureen Kraft; Aurelien Levy; David MacDonald; Mary Jo Mueller; Donald Raikes; Corominas Ramon; Roberto Scano; Samuel Sirois; Sarah J Swierenga; Eric Velleman; Konstantinos Votis; Kathleen Wahlbin; Elle Waters; Richard Warren; Léonie Watson.

[Authoring Tool Accessibility Guidelines (ATAG) 2.0](https://www.w3.org/TR/ATAG20/) [[Easy-Checks](https://www.w3.org/TR/wcag-em-2/#bib-easy-checks "Easy Checks - A First Review of Web Accessibility")] [[Essential-Components-of-Web-Accessibility](https://www.w3.org/TR/wcag-em-2/#bib-essential-components-of-web-accessibility "Essential Components of Web Accessibility")] [[How-People-with-Disabilities-Use-the-Web](https://www.w3.org/TR/wcag-em-2/#bib-how-people-with-disabilities-use-the-web "How People with Disabilities Use the Web")] [[Involving-Users-in-Evaluating-Web-Accessibility](https://www.w3.org/TR/wcag-em-2/#bib-involving-users-in-evaluating-web-accessibility "Involving Users in Evaluating Web Accessibility")] [[Selecting-Web-Accessibility-Evaluation-Tools](https://www.w3.org/TR/wcag-em-2/#bib-selecting-web-accessibility-evaluation-tools "Selecting Web Accessibility Evaluation Tools")] [[Using-Combined-Expertise-to-Evaluate-Web-Accessibility](https://www.w3.org/TR/wcag-em-2/#bib-using-combined-expertise-to-evaluate-web-accessibility "Using Combined Expertise to Evaluate Web Accessibility")] [[UWEM](https://www.w3.org/TR/wcag-em-2/#bib-uwem "D-WAB4 Unified Web Evaluation Methodology \(UWEM 1.2 Core\)")] 

## References

### Informative references

[ATAG20]
     [Authoring Tool Accessibility Guidelines (ATAG) 2.0](https://www.w3.org/TR/ATAG20/). Jan Richards; Jeanne F Spellman; Jutta Treviranus. W3C. 24 September 2015. W3C Recommendation. URL: <https://www.w3.org/TR/ATAG20/>
[Easy-Checks]
     [Easy Checks - A First Review of Web Accessibility](https://www.w3.org/WAI/eval/preliminary). Lawton Henry S, ed (2014). W3C. URL: <https://www.w3.org/WAI/eval/preliminary>
[Essential-Components-of-Web-Accessibility]
     [Essential Components of Web Accessibility](https://www.w3.org/WAI/fundamentals/components/). Lawton Henry S, ed (2005). Essential Components of Web Accessibility. Version 1.3. W3C. URL: <https://www.w3.org/WAI/fundamentals/components/>
[etsi-en-301-549]
     [ETSI EN 301 549 V3.2.1 (2021-03): Accessibility requirements for ICT products and services](http://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf). ETSI. March 2021. Published. URL: <http://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf>
[How-People-with-Disabilities-Use-the-Web]
     [How People with Disabilities Use the Web](https://www.w3.org/WAI/people-use-web/). Abou-Zahra S, ed (2012). Draft. W3C. URL: <https://www.w3.org/WAI/people-use-web/>
[Involving-Users-in-Evaluating-Web-Accessibility]
     [Involving Users in Evaluating Web Accessibility](https://www.w3.org/WAI/test-evaluate/involving-users/). Lawton Henry S, ed (2010). Involving Users in Evaluating Web Accessibility. W3C. URL: <https://www.w3.org/WAI/test-evaluate/involving-users/>
[Selecting-Web-Accessibility-Evaluation-Tools]
     [Selecting Web Accessibility Evaluation Tools](https://www.w3.org/WAI/test-evaluate/tools/selecting/). Abou-Zahra S, ed (2005). W3C. URL: <https://www.w3.org/WAI/test-evaluate/tools/selecting/>
[Understanding-WCAG22]
     [Understanding WCAG 2.2 - A guide to understanding and implementing Web Content Accessibility Guidelines 2.2](https://www.w3.org/WAI/WCAG22/Understanding/). Campbell A, Adams C, Montgomery RB, Cooper M, eds (2025). W3C. URL: <https://www.w3.org/WAI/WCAG22/Understanding/>
[Using-Combined-Expertise-to-Evaluate-Web-Accessibility]
     [Using Combined Expertise to Evaluate Web Accessibility](https://www.w3.org/WAI/test-evaluate/combined-expertise/). Brewer J, ed (2002). W3C. URL: <https://www.w3.org/WAI/test-evaluate/combined-expertise/>
[UWEM]
     [D-WAB4 Unified Web Evaluation Methodology (UWEM 1.2 Core)](https://link.springer.com/chapter/10.1007/978-3-540-73283-9_21). Velleman E.M, Velasco C.A, Snaprud M, eds (2007). Wabcluster. URL: <https://link.springer.com/chapter/10.1007/978-3-540-73283-9_21>
[WCAG-EM-Report-Tool]
     [WCAG-EM Report Tool](https://www.w3.org/WAI/eval/report-tool/). Abou-Zahra S, project lead, de Vries H, design/development, Hansma M, development (2021). W3C. URL: <https://www.w3.org/WAI/eval/report-tool/>
[WCAG2-Overview]
     [Web Content Accessibility Guidelines (WCAG) Overview](https://www.w3.org/WAI/standards-guidelines/wcag/). Lawton Henry S, ed (2012). W3C. URL: <https://www.w3.org/WAI/standards-guidelines/wcag/>
[WCAG22]
     [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/). Michael Cooper; Andrew Kirkpatrick; Alastair Campbell; Rachael Bradley Montgomery; Charles Adams. W3C. 12 December 2024. W3C Recommendation. URL: <https://www.w3.org/TR/WCAG22/>
[WCAG22-TECHS]
     [Techniques and Failures for Web Content Accessibility Guidelines 2.2](https://www.w3.org/WAI/WCAG22/Techniques/). Campbell A, Adams C, Montgomery RB, Cooper M, eds (2025). Techniques and Failures for Web Content Accessibility Guidelines 2.2. W3C. URL: <https://www.w3.org/WAI/WCAG22/Techniques/>
[wcag2ict-22]
     [Guidance on Applying WCAG 2 to Non-Web Information and Communications Technologies (WCAG2ICT)](https://www.w3.org/TR/wcag2ict-22/). Mary Jo Mueller; Phil Day; Daniel Montalvo. W3C. 11 December 2025. W3C Working Group Note. URL: <https://www.w3.org/TR/wcag2ict-22/>
[wcag2mobile-22]
     [Guidance on Applying WCAG 2.2 to Mobile Applications (WCAG2Mobile)](https://www.w3.org/TR/wcag2mobile-22/). Jon Gibbins; Jamie Herrera; Joe Humbert; Jan Jaap de Groot; Julian Kittelson-Aldred. W3C. 6 May 2025. DNOTE. URL: <https://www.w3.org/TR/wcag2mobile-22/>
  *[W3C]: World Wide Web Consortium
  *[ W3C]: World Wide Web Consortium
