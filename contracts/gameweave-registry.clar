;; GameWeave Platform Registry Contract
;; A secure and extensible registry for cross-game NFT platform integrations
;; Enables game platforms to register, be verified, and interact seamlessly

;; Constants and Error Codes
(define-constant CONTRACT-OWNER tx-sender)

;; Error Codes
(define-constant ERR-UNAUTHORIZED (err u100))           ;; Unauthorized access attempt
(define-constant ERR-PLATFORM-EXISTS (err u101))        ;; Platform already registered
(define-constant ERR-PLATFORM-NOT-FOUND (err u102))     ;; Platform not found in registry
(define-constant ERR-REGISTRATION-PAUSED (err u103))    ;; Registration currently disabled
(define-constant ERR-INVALID-CONTRACT-ADDRESS (err u104)) ;; Invalid contract address provided

;; Data Variables
(define-data-var is-registration-paused bool false)

;; Data Maps
(define-map platforms 
    { platform-id: uint }
    {
        name: (string-ascii 50),
        description: (string-ascii 250),
        contract-address: principal,
        verified: bool,
        active: bool
    }
)

(define-map platform-ids-by-contract-address 
    { contract-address: principal }
    { platform-id: uint }
)

(define-data-var next-platform-id uint u0)

;; Authorization Check
;; Verifies if the sender is the contract owner
(define-private (is-contract-owner (sender principal))
    (is-eq sender CONTRACT-OWNER)
)

;; Validation Helper Functions
;; Ensures the contract address is valid and not the owner/sender
(define-private (is-valid-contract-address (addr principal))
    (and 
        (not (is-eq addr CONTRACT-OWNER))
        (not (is-eq addr tx-sender))
    )
)

;; Toggle Registration Pause
(define-public (toggle-registration-pause)
    (begin
        (asserts! (is-contract-owner tx-sender) (err ERR_UNAUTHORIZED))
        (var-set is-registration-paused (not (var-get is-registration-paused)))
        (ok true)
    )
)

;; Register a New Game Platform
(define-public (register-platform 
    (name (string-ascii 50)) 
    (description (string-ascii 250))
    (contract-address principal)
)
    (let 
        (
            (platform-id (+ (var-get next-platform-id) u1))
        )
        ;; Authorization and validation checks
        (asserts! (is-contract-owner tx-sender) (err ERR_UNAUTHORIZED))
        (asserts! (not (var-get is-registration-paused)) (err ERR_REGISTRATION_PAUSED))
        (asserts! (is-valid-contract-address contract-address) (err ERR_INVALID_CONTRACT_ADDRESS))
        (asserts! (is-none (map-get? platform-ids-by-contract-address { contract-address: contract-address })) (err ERR_PLATFORM_EXISTS))

        ;; Register platform
        (map-set platforms 
            { platform-id: platform-id }
            {
                name: name,
                description: description,
                contract-address: contract-address, 
                verified: false,
                active: true
            }
        )
        (map-set platform-ids-by-contract-address 
            { contract-address: contract-address }
            { platform-id: platform-id }
        )
        (var-set next-platform-id platform-id)
        (ok platform-id)
    )
)

;; Verify a Platform
(define-public (verify-platform (platform-id uint))
    (let 
        (
            (platform (unwrap! 
                (map-get? platforms { platform-id: platform-id }) 
                (err ERR_PLATFORM_NOT_FOUND)
            ))
        )
        (asserts! (is-contract-owner tx-sender) (err ERR_UNAUTHORIZED))
        (map-set platforms 
            { platform-id: platform-id }
            (merge platform { verified: true })
        )
        (ok true)
    )
)

;; Read Platform Details
(define-read-only (get-platform-details (platform-id uint))
    (map-get? platforms { platform-id: platform-id })
)

;; Read Platform ID by Contract Address
(define-read-only (get-platform-id-by-address (contract-address principal))
    (map-get? platform-ids-by-contract-address { contract-address: contract-address })
)

;; Check Platform Verification Status
(define-read-only (is-platform-verified (platform-id uint))
    (let 
        (
            (platform (unwrap! 
                (map-get? platforms { platform-id: platform-id }) 
                false
            ))
        )
        (get verified platform)
    )
)