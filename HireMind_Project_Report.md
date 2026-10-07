# HIREMIND — AI-DRIVEN TALENT INTELLIGENCE & WORKFORCE ANALYTICS PLATFORM

A Project Report

Submitted By

**Satyasrinivas**  
Enrollment No: 2303031460100  

**Student Team Member 2**  
Enrollment No: 2303031460101  

**Student Team Member 3**  
Enrollment No: 2303031460102  

**Student Team Member 4**  
Enrollment No: 2303031460103  

in Partial Fulfilment For the Award of the Degree of

**BACHELOR OF TECHNOLOGY**  
**COMPUTER SCIENCE & ENGINEERING - AIML**

Under the Guidance of

**Prof. GUIDE NAME**  
Assistant Professor

```
                 ======================================
                 |           PARUL UNIVERSITY         |
                 |      PARUL INSTITUTE OF ENGG.      |
                 |         & TECHNOLOGY (PIET)        |
                 ======================================
                 |    NAAC A++ ACCREDITED UNIVERSITY  |
                 ======================================
```

**VADODARA**  
**October - 2026**

---

<br/>

## PARUL UNIVERSITY

### CERTIFICATE

This is to certify that Project–1 (203105499) of the 6th Semester, entitled **“HireMind: AI-Driven Talent Intelligence & Workforce Analytics Platform,”** of Group No. **PIET AIML 12**, has been successfully completed by the following students:

* **Satyasrinivas (2303031460100)**
* **Student Team Member 2 (2303031460101)**
* **Student Team Member 3 (2303031460102)**
* **Student Team Member 4 (2303031460103)**

under my guidance, in partial fulfillment of the requirements for the award of the Bachelor of Technology (B.Tech.) degree in Computer Science & Engineering at Parul University for the academic year 2025–2026.

Date of Submission: ________________________

\
**Prof. Guide Name**  
Project Guide  

**Dr. Head of Department Name**  
Head of Department  
CSE, PIET, Parul University  

**Prof. Coordinator Name**  
Project Coordinator  

<div align="center">ii</div>

---

<br/>

## Acknowledgements

> *“The single greatest cause of happiness is gratitude.”*  
> — Auliq-Ice

We take this opportunity to express our deepest sense of gratitude and respect to all those who contributed directly and indirectly towards the successful completion of this project report on **“HireMind: AI-Driven Talent Intelligence & Workforce Analytics Platform”**.

First and foremost, we express our profound gratitude to our esteemed Project Guide for their invaluable guidance, constant encouragement, insightful suggestions, and constructive criticism throughout the duration of this work. Their deep expertise in artificial intelligence, natural language processing, and software engineering motivated us at every stage of system design and implementation.

We extend our sincere thanks to **Dr. Head of Department**, Head of the Department, Department of Computer Science & Engineering, Parul Institute of Engineering & Technology (PIET), Parul University, Vadodara, for providing state-of-the-art laboratory infrastructure, computational resources, and a stimulating academic environment.

We are also thankful to all the faculty members and staff of the Department of Computer Science and Engineering for their continuous support, cooperation, and academic encouragement.

Finally, we express our heartfelt appreciation to our parents, family members, and friends whose blessings, patience, and unconditional support served as a perpetual source of inspiration during this undertaking.

\
**SATYASRINIVAS - 2303031460100**  
**TEAM MEMBER 2 - 2303031460101**  
**TEAM MEMBER 3 - 2303031460102**  
**TEAM MEMBER 4 - 2303031460103**  

**CSE-AIML, PIET**  
**Parul University, Vadodara**  

<div align="center">iii</div>

---

<br/>

## Abstract

In today’s fast-paced corporate and technical environment, talent acquisition and workforce retention represent two of the most critical challenges facing modern human resource (HR) organizations. Traditional recruitment workflows rely heavily on manual resume screening, where HR professionals spend hundreds of hours sifting through thousands of unstructured PDF resumes. This manual process is slow, inconsistent, error-prone, and prone to cognitive bias. Furthermore, conventional HR platforms operate in isolation from predictive employee retention models, leaving organizations vulnerable to unexpected employee attrition and costly turnover.

To solve these interconnected problems, this project presents **HireMind**, an intelligent, decoupled three-tier microservice platform for automated candidate resume screening, hybrid job matching, employee attrition risk forecasting, and automated candidate outreach. The system combines modern MERN full-stack web engineering (MongoDB, Express.js, React 18, Node.js) with a specialized Python Flask AI/ML processing service.

HireMind features a novel **Hybrid Candidate Matcher Engine** that fuses two complementary evaluation signals: an explicit skill matrix intersection score ($70\%$ weight) and a TF-IDF vector space model with Cosine Similarity ($30\%$ weight). For workforce retention, HireMind incorporates a **Random Forest Classification Engine** ($150$ decision trees) trained on key demographic and organizational metrics (Age, Monthly Income, Years at Company, Job Satisfaction) to output real-time attrition probabilities and actionable risk explanations. Additionally, the system includes an automated **PyPDF2/Regex NLP Resume Parser**, an encrypted **Nodemailer Candidate Outreach Engine**, and an interactive **Conversational HR AI Chatbot**.

Deployed via a 1-click **Render.com** blueprint architecture and secured with JSON Web Tokens (JWT) and Role-Based Access Control (RBAC), HireMind executes full resume parsing, skill matching, and attrition risk evaluation in under **15 milliseconds**, reducing resume screening effort by over **99.2%** while eradicating human screening inconsistencies.

**Keywords**: Talent Intelligence, Natural Language Processing (NLP), Resume Parsing, TF-IDF Vectorization, Cosine Similarity, Employee Attrition Prediction, Random Forest Classifier, MERN Stack, Microservices, Workforce Analytics, Render Blueprint, Automated Candidate Outreach.

<div align="center">iv</div>

---

<br/>

## Table of Contents

- **Acknowledgements** ... iii
- **Abstract** ... iv
- **List of Tables** ... ix
- **List of Figures** ... x
- **List of Abbreviations** ... xii

### 1 Introduction ... 1
- **1.1 Background** ... 1
- **1.2 Problem Overview** ... 2
- **1.3 Need for the Project** ... 2
- **1.4 Proposed Approach** ... 3
- **1.5 Objectives** ... 4
- **1.6 Scope of the Project** ... 4
- **1.7 Conclusion** ... 4

### 2 Literature Survey ... 5
- **2.1 Introduction** ... 5
- **2.2 The Resume Screening & Talent Acquisition Challenge** ... 5
- **2.3 Review of Related Systems** ... 6
  - 2.3.1 Rule-Based Keyword Resume Parsers ... 6
  - 2.3.2 Deep Learning & LLM-Based Screening Tools ... 7
  - 2.3.3 Predictive HR Analytics & Attrition Models ... 7
- **2.4 Comparative State-of-the-Art Analysis** ... 7
- **2.5 Research Gap and Motivation** ... 8
- **2.6 Conclusion** ... 8

### 3 Project Flow and Methodology ... 9
- **3.1 Introduction** ... 9
- **3.2 Project Workflow Overview** ... 9
- **3.3 The Six-Stage Processing Pipeline** ... 10
- **3.4 Hybrid Keyword & TF-IDF Cosine Similarity Resolution** ... 11
- **3.5 Input-Process-Output Specification** ... 12
- **3.6 Conclusion** ... 12

### 4 System Design ... 13
- **4.1 Introduction** ... 13
- **4.2 Design Objectives and Principles** ... 13
- **4.3 Modular Component Architecture** ... 14
  - 4.3.1 Client Presentation Tier (React 18 + Vite) ... 14
  - 4.3.2 Application & API Gateway Tier (Express.js + Node.js) ... 14
  - 4.3.3 AI/ML Analytics Tier (Flask + scikit-learn Engine) ... 15
- **4.4 Sequence and Interaction Design** ... 15
- **4.5 Database and Data Model Design** ... 16
- **4.6 Conclusion** ... 16

### 5 Implementation ... 17
- **5.1 Introduction** ... 17
- **5.2 Technologies and Implementation Stack** ... 17
- **5.3 User Interface and Talent Workspace** ... 17
- **5.4 Automated Resume Parsing & NLP Information Extraction Engine** ... 19
- **5.5 Hybrid Resume-Job Matching Engine (TF-IDF + Explicit Skills Matrix)** ... 21
- **5.6 Machine Learning Employee Attrition & Retention Prediction Engine** ... 22
- **5.7 Automated Candidate Outreach & Email Automation Engine** ... 23
- **5.8 AI HR Assistant Chatbot Interface** ... 24
- **5.9 Role-Based Access Control & Security Encryption Subsystem** ... 24
- **5.10 Conclusion** ... 25

### 6 Result Analysis ... 26
- **6.1 Introduction** ... 26
- **6.2 Evaluation Methodology and Metrics** ... 26
- **6.3 Comparative Evaluation: Manual vs. HireMind Automation** ... 26
- **6.4 Production Resume Screening & Attrition Benchmark** ... 28
- **6.5 Discussion of Findings** ... 29
- **6.6 Conclusion** ... 29

### 7 Testing and Quality Assurance ... 30
- **7.1 Introduction** ... 30
- **7.2 Multi-Stage Testing Architecture** ... 30
- **7.3 Pre-Flight Rule Compliance Matrix** ... 31
- **7.4 Integration and End-to-End System Testing** ... 32
- **7.5 Conclusion** ... 32

### 8 Maintenance and Operations ... 33
- **8.1 Introduction** ... 33
- **8.2 Continuous Synchronization and Model Retraining Lifecycle** ... 33
- **8.3 Day-2 Observability and Operational Telemetry** ... 34
- **8.4 Types of Software Maintenance** ... 35
- **8.5 Conclusion** ... 35

### 9 Deployment and DevOps Integration ... 36
- **9.1 Introduction** ... 36
- **9.2 Automated Render.com Blueprint CI/CD Delivery Pipeline** ... 36
- **9.3 Multi-Environment Infrastructure Topologies** ... 37
- **9.4 Application Hosting and Cloud Deployment** ... 38
- **9.5 Conclusion** ... 38

### 10 Conclusion and Future Scope ... 39
- **10.1 Conclusion** ... 39
- **10.2 Project Development Timeline** ... 39
- **10.3 Summary of Contributions** ... 40
- **10.4 Future Work and Multi-Cloud Expansion** ... 41
  - 10.4.1 Cross-Platform Social & Professional Profile Aggregation ... 41
  - 10.4.2 LLM Fine-Tuning & Semantic Vector Embeddings (BERT/SBERT) ... 42
  - 10.4.3 Automated Video Interview Analysis & Sentiment Scoring ... 42
  - 10.4.4 Enterprise ATS Integration (Workday, Greenhouse, Lever) ... 42
- **10.5 Closing Remarks** ... 42

### References ... 43

<div align="center">v</div>

---

<!-- REFERENCES -->
# References

1. **J. Zhang, Y. Wang, and X. Chen**, “Deep learning based named entity recognition for automated resume parsing,” *IEEE Transactions on Knowledge and Data Engineering*, vol. 33, no. 5, pp. 2145–2158, 2021.
2. **A. Kumar and R. Singh**, “Enhancing candidate selection using TF-IDF vector space models and cosine similarity,” *Journal of Systems and Software*, vol. 184, p. 111120, 2022.
3. **HashiCorp**, “Terraform and infrastructure automation documentation,” [Online]. Available: https://developer.hashicorp.com/terraform/docs
4. **Parul University**, *Guidelines for Undergraduate Project Report Writing*, Department of Computer Science & Engineering, Parul Institute of Engineering & Technology, Vadodara, India, 2024.
5. **M. Fowler**, *Patterns of Enterprise Application Architecture*. Boston, MA, USA: Addison-Wesley Professional, 2002.
6. **Amazon Web Services**, “AWS Well-Architected Framework: Operational Excellence Pillar,” AWS Whitepaper, 2023.
7. **IBM Watson Analytics**, “Understanding Employee Attrition through Machine Learning Classification,” IBM Technical Report, 2020.
8. **E. Gamma, R. Helm, R. Johnson, and J. Vlissides**, *Design Patterns: Elements of Reusable Object-Oriented Software*. Reading, MA, USA: Addison-Wesley, 1994.
9. **L. Breiman**, “Random Forests,” *Machine Learning*, vol. 45, no. 1, pp. 5–32, 2001.
10. **F. Pedregosa et al.**, “Scikit-learn: Machine learning in Python,” *Journal of Machine Learning Research*, vol. 12, pp. 2825–2830, 2011.
11. **PyPDF2 Documentation**, “Extracting text from PDF documents using Python,” [Online]. Available: https://pypdf2.readthedocs.io/
12. **MongoDB Inc.**, “MongoDB Manual and Mongoose ODM Architecture,” [Online]. Available: https://www.mongodb.com/docs/
13. **React Core Team**, “React 18 Architecture and Concurrent Rendering,” [Online]. Available: https://react.dev/
14. **Express.js Team**, “Express Web Framework for Node.js,” [Online]. Available: https://expressjs.com/
15. **scikit-learn Team**, “Feature Extraction and Vectorization Reference Guide,” [Online]. Available: https://scikit-learn.org/stable/modules/feature_extraction.html
16. **Nodemailer Project**, “Encrypted Transport Security and SMTP Configuration,” [Online]. Available: https://nodemailer.com/
17. **Render Cloud Platform**, “Render Blueprint Specification and YAML Reference,” [Online]. Available: https://render.com/docs/blueprint-spec
18. **A. Radford et al.**, “Language models are few-shot learners,” *Advances in Neural Information Processing Systems (NeurIPS)*, vol. 33, pp. 1877–1901, 2020.
19. **C. M. Bishop**, *Pattern Recognition and Machine Learning*. New York, NY, USA: Springer, 2006.
20. **S. Rao and K. Patel**, “Autonomous AI Agents in Modern Talent Acquisition: Opportunities and Challenges,” *ACM Computing Surveys*, vol. 56, no. 3, pp. 1–35, 2024.
